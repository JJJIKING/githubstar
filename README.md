# GitHub Star Board 🌟

A minimalist, fully automated, and serverless open-source project discovery leaderboard.

**[🇨🇳 中文说明 (Chinese)](#中文文档) | [🇬🇧 English Documentation](#english-documentation)**

---

## English Documentation

GitHub Star Board is a completely free and fully automated platform to track the fastest-growing and most starred open-source projects on GitHub. 

### ✨ Features
- **Zero Server Cost**: Hosted entirely on GitHub Pages.
- **Fully Automated Data Pipeline**: GitHub Actions scrape real-time trending data daily.
- **Native Scraping Engine**: Independent data fetching directly from `github.com/trending` across multiple popular languages.
- **Deep Leaderboards**: Tracks up to 150 repositories for Daily/Weekly/Monthly trending, and up to 300 repositories for the all-time leaderboard.
- **Modern Minimalist UI**: Glassmorphism design with automatic dark mode support.
- **Strict Sorting**: Trending lists are strictly sorted by **newly acquired stars**, while overall lists are sorted by **total stars**.

### 🚀 Getting Started
This project requires zero infrastructure setup. Just fork or push to your own repository!

1. **Enable GitHub Actions**: Go to your repository settings `Settings > Actions > General` and set **Workflow permissions** to `Read and write permissions`.
2. **Enable GitHub Pages**: Go to `Settings > Pages` and set the source to `GitHub Actions`.
3. **Trigger the First Run**: Go to the `Actions` tab, click on `Update Trending Data`, and select `Run workflow` to fetch your initial dataset.

---

## 中文文档

GitHub Star Board 是一个极简、完全自动化且零服务器成本的开源项目发现聚合榜单。

### ✨ 核心功能
- **零服务器成本**：纯前端静态页面，完全依托 GitHub Pages 托管。
- **全自动化数据管线**：利用 GitHub Actions 作为云端爬虫，每天准时全自动更新数据并重新部署页面。
- **原生提取引擎**：不依赖任何第三方榜单，直接按多语言轮询原生抓取 `github.com/trending` 以获得最一手、最准确的星标增量数据。
- **深度榜单支持**：每一期榜单涵盖高达 **150个** 热门仓库；历史总榜容纳多达 **300个** 顶尖项目。
- **极简现代 UI**：采用玻璃拟物化 (Glassmorphism) 深色模式设计，带来极其沉浸的浏览体验。
- **严格排序算法**：“飙升榜”将严格且唯一遵循**净增星数**排序，“总榜”则严格遵循**总星际数**排序。

### 🚀 如何部署拥有你自己的专属榜单？
本项目的初衷就是让任何人都能在 1 分钟内零成本拥有一个自动更新的榜单。

1. **开启 Actions 写入权限**：进入你代码库的网页点击 `Settings > Actions > General`，滚动到底部将 **Workflow permissions** 修改为 `Read and write permissions` 并保存。
2. **开启 Pages 服务**：点击 `Settings > Pages`，在 `Build and deployment` 的源 (Source) 下拉菜单中选择 `GitHub Actions`。
3. **完成首次数据抓取**：点击代码库顶部的 `Actions` 标签，左侧选中 `Update Trending Data`，点击右边的 `Run workflow` 按钮手动触发第一次爬虫抓取。稍等片刻，你的专属榜单就上线了！

---
*Built with ❤️ using React, Vite, and GitHub Actions.*
