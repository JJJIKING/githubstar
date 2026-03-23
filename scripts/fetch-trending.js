import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Optional, helps with rate limits

async function fetchTrending(query) {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=50`;
    const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitHub-Star-Board'
    };
    if (GITHUB_TOKEN) {
        headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
        throw new Error(`GitHub API Error: ${response.status} - ${await response.text()}`);
    }
    const data = await response.json();

    // Pick only the minimal fields we need for the frontend
    return data.items.map(repo => ({
        id: repo.id,
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
}

function getFormattedDate(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
}

import * as cheerio from 'cheerio';

async function scrapeGithubTrending(since = 'daily') {
    const url = `https://github.com/trending?since=${since}`;
    console.log(`Scraping GitHub Trending for ${since}...`);
    try {
        const response = await fetch(url);
        if (!response.ok) return [];
        const html = await response.text();
        const $ = cheerio.load(html);
        const repos = [];

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
            const growthStars = growthStarsMatch ? parseInt(growthStarsMatch[1]) : null;

            repos.push({
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
        });
        return repos;
    } catch (err) {
        console.error(`Failed to scrape ${since}:`, err);
        return [];
    }
}

async function main() {
    console.log("Fetching trending repositories independently...");
    try {
        // Fetch real trending by scraping github.com/trending natively
        const trending_daily = await scrapeGithubTrending('daily');
        console.log(`Scraped ${trending_daily.length} daily repos natively.`);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        const trending_weekly = await scrapeGithubTrending('weekly');
        console.log(`Scraped ${trending_weekly.length} weekly repos natively.`);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        const trending_monthly = await scrapeGithubTrending('monthly');
        console.log(`Scraped ${trending_monthly.length} monthly repos natively.`);
        
        // Fetch overall stats using official GitHub Search API
        await new Promise(resolve => setTimeout(resolve, 2000));
        const overall_yearly = await fetchTrending(`created:>=${getFormattedDate(365)}`);
        console.log(`Fetched ${overall_yearly.length} yearly repos via Search API.`);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        const overall_all = await fetchTrending(`stars:>10000`);
        console.log(`Fetched ${overall_all.length} overall repos via Search API.`);

        const result = {
            lastUpdated: new Date().toISOString(),
            trending_daily,
            trending_weekly,
            trending_monthly,
            overall_yearly,
            overall_all
        };

        const outPath = path.join(__dirname, '../src/data/trending.json');
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
        
        console.log("Data successfully saved to src/data/trending.json");
    } catch (error) {
        console.error("Error fetching data:", error);
        process.exit(1);
    }
}

main();
