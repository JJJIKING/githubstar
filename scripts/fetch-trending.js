import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Optional, helps with rate limits for Search API

// Official Github Search API logic (used for "Overall" leaderboards)
async function fetchTrending(query, targetCount = 150) {
    const repos = [];
    let page = 1;
    
    // We fetch 100 items per page up to target count
    while (repos.length < targetCount && page <= Math.ceil(targetCount / 100)) {
        const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=100&page=${page}`;
        console.log(`Fetching from Search API: ${url}`);
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'GitHub-Star-Board'
        };
        if (GITHUB_TOKEN) {
            headers['Authorization'] = `token ${GITHUB_TOKEN}`;
        }

        try {
            const response = await fetch(url, { headers });
            if (!response.ok) {
                console.error(`GitHub API Error: ${response.status} - ${await response.text()}`);
                break;
            }
            const data = await response.json();
            if (!data.items || data.items.length === 0) break;
            
            const items = data.items.map(repo => ({
                id: repo.full_name,
                name: repo.name,
                full_name: repo.full_name,
                description: repo.description,
                stargazers_count: repo.stargazers_count,
                language: repo.language,
                html_url: repo.html_url,
                owner: {
                    login: repo.owner.login,
                    avatar_url: repo.owner.avatar_url,
                }
            }));
            repos.push(...items);
        } catch (e) {
            console.error(e);
            break;
        }
        page++;
        await new Promise(r => setTimeout(r, 1000)); // Sleep safely against rate limit
    }
    
    // Deduplicate and strictly sort by total stars descending
    const uniqueMap = new Map(repos.map(r => [r.id, r]));
    const uniqueRepos = Array.from(uniqueMap.values());
    uniqueRepos.sort((a, b) => b.stargazers_count - a.stargazers_count);
    return uniqueRepos.slice(0, targetCount);
}

function getFormattedDate(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
}

import * as cheerio from 'cheerio';

// Native GitHub Trending Scraper logic (fully independent of OpenGithubs)
async function scrapeGithubTrending(since = 'daily', targetCount = 150) {
    // Scrape multiple popular language pages to accumulate 150+ trending repos
    const languages = ['', 'javascript', 'python', 'typescript', 'java', 'c++', 'go', 'rust', 'php', 'c', 'ruby', 'swift', 'shell', 'kotlin', 'dart'];
    const reposMap = new Map();

    console.log(`Scraping GitHub Trending for ${since} to collect ~${targetCount} repos...`);
    
    for (const lang of languages) {
        const langPath = lang ? `/${encodeURIComponent(lang)}` : '';
        const url = `https://github.com/trending${langPath}?since=${since}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.log(`Failed fetching ${url}, status: ${response.status}`);
                continue;
            }
            const html = await response.text();
            const $ = cheerio.load(html);

            $('article.Box-row').each((i, element) => {
                const titleEl = $(element).find('h2 a');
                const href = titleEl.attr('href');
                if (!href) return;
                
                const full_name = href.substring(1);
                const parts = full_name.split('/');
                const owner = parts[0];
                const name = parts[1];

                const description = $(element).find('p').text().trim();
                const detailsDiv = $(element).find('div.f6');
                
                const langEl = detailsDiv.find('span[itemprop="programmingLanguage"]');
                const language = langEl.length ? langEl.text().trim() : null;
                
                const starsLink = detailsDiv.find('a[href$="/stargazers"]');
                const totalStarsText = starsLink.text().trim().replace(/,/g, '');
                const totalStars = parseInt(totalStarsText) || 0;
                
                const growthText = detailsDiv.find('span.float-sm-right').text().trim().replace(/,/g, '');
                const growthStarsMatch = growthText.match(/(\d+)/);
                const growthStars = growthStarsMatch ? parseInt(growthStarsMatch[1]) : 0;

                if (!reposMap.has(full_name)) {
                    reposMap.set(full_name, {
                        id: full_name,
                        name: name,
                        full_name: full_name,
                        description: description,
                        stargazers_count: totalStars,
                        growth_stars: growthStars,
                        language: language,
                        html_url: `https://github.com/${full_name}`,
                        owner: {
                            login: owner,
                            avatar_url: `https://github.com/${owner}.png`
                        }
                    });
                }
            });
        } catch (err) {
            console.error(`Failed to scrape ${url}:`, err);
        }
        // Small delay to prevent IP block
        await new Promise(r => setTimeout(r, 600));
    }
    
    const allRepos = Array.from(reposMap.values());
    // Sort strictly by newly added stars (growth_stars) descending!
    allRepos.sort((a, b) => b.growth_stars - a.growth_stars);
    return allRepos.slice(0, targetCount);
}

async function main() {
    console.log("Fetching trending repositories independently...");
    try {
        // 1. Trending Lists (Scraped natively based on growth stars) - 150 items each
        const trending_daily = await scrapeGithubTrending('daily', 150);
        console.log(`Scraped ${trending_daily.length} daily repos (sorted by growth).`);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        const trending_weekly = await scrapeGithubTrending('weekly', 150);
        console.log(`Scraped ${trending_weekly.length} weekly repos (sorted by growth).`);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        const trending_monthly = await scrapeGithubTrending('monthly', 150);
        console.log(`Scraped ${trending_monthly.length} monthly repos (sorted by growth).`);
        
        // 2. Overall Lists (Official GitHub API, strictly filtered by created date and sorted by total stars)
        await new Promise(resolve => setTimeout(resolve, 2000));
        const overall_weekly = await fetchTrending(`created:>=${getFormattedDate(7)}`, 150);
        console.log(`Fetched ${overall_weekly.length} overall weekly repos.`);

        await new Promise(resolve => setTimeout(resolve, 2000));
        const overall_monthly = await fetchTrending(`created:>=${getFormattedDate(30)}`, 150);
        console.log(`Fetched ${overall_monthly.length} overall monthly repos.`);

        await new Promise(resolve => setTimeout(resolve, 2000));
        const overall_yearly = await fetchTrending(`created:>=${getFormattedDate(365)}`, 150);
        console.log(`Fetched ${overall_yearly.length} overall yearly repos.`);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        const overall_all = await fetchTrending(`stars:>1000`, 300); // 历史总榜 300个
        console.log(`Fetched ${overall_all.length} overall history repos.`);

        const result = {
            lastUpdated: new Date().toISOString(),
            trending_daily,
            trending_weekly,
            trending_monthly,
            overall_weekly,
            overall_monthly,
            overall_yearly,
            overall_all
        };

        const outPath = path.join(__dirname, '../public/trending.json');
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
        
        console.log("Data successfully saved to public/trending.json");
    } catch (error) {
        console.error("Error fetching data:", error);
        process.exit(1);
    }
}

main();
