#!/usr/bin/env python3
"""
Dynamic SVG Generator - Updates SVG files with real-time data
"""

import os
import json
import logging
from typing import Dict, Any, List
from datetime import datetime

try:
    import requests
    from requests.exceptions import RequestException
except ImportError:
    raise ImportError("requests library is required. Install with: pip install requests")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SVGGenerator:
    """Generate dynamic SVG files with real-time data."""
    
    def __init__(self, github_token: str = None):
        self.github_token = github_token or os.getenv("GITHUB_TOKEN")
        self.headers = {
            "Accept": "application/vnd.github.v3+json"
        }
        if self.github_token:
            self.headers["Authorization"] = f"token {self.github_token}"
    
    def fetch_repo_stats(self, owner: str, repo: str) -> Dict[str, Any]:
        """Fetch repository statistics from GitHub API."""
        url = f"https://api.github.com/repos/{owner}/{repo}"
        
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            return {
                "stars": data.get("stargazers_count", 0),
                "forks": data.get("forks_count", 0),
                "issues": data.get("open_issues_count", 0),
                "language": data.get("language", "Unknown"),
                "description": data.get("description", ""),
                "updated_at": data.get("updated_at", "")
            }
        except RequestException as e:
            logger.error(f"Failed to fetch repo stats for {repo}: {e}")
            return {
                "stars": 0,
                "forks": 0,
                "issues": 0,
                "language": "Unknown",
                "description": "",
                "updated_at": ""
            }
    
    def fetch_user_stats(self, username: str) -> Dict[str, Any]:
        """Fetch user statistics from GitHub API."""
        url = f"https://api.github.com/users/{username}"
        
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            return {
                "public_repos": data.get("public_repos", 0),
                "followers": data.get("followers", 0),
                "following": data.get("following", 0),
                "created_at": data.get("created_at", "")
            }
        except RequestException as e:
            logger.error(f"Failed to fetch user stats for {username}: {e}")
            return {
                "public_repos": 0,
                "followers": 0,
                "following": 0,
                "created_at": ""
            }
    
    def fetch_language_stats(self, username: str) -> Dict[str, float]:
        """Fetch language statistics from GitHub API."""
        url = f"https://api.github.com/users/{username}/repos"
        
        try:
            response = requests.get(
                url, 
                headers=self.headers, 
                params={"per_page": 100, "sort": "updated"},
                timeout=10
            )
            response.raise_for_status()
            repos = response.json()
            
            language_bytes = {}
            total_bytes = 0
            
            for repo in repos:
                if repo.get("language"):
                    try:
                        lang_url = f"https://api.github.com/repos/{username}/{repo['name']}/languages"
                        lang_response = requests.get(lang_url, headers=self.headers, timeout=10)
                        if lang_response.status_code == 200:
                            languages = lang_response.json()
                            for lang, bytes_count in languages.items():
                                language_bytes[lang] = language_bytes.get(lang, 0) + bytes_count
                                total_bytes += bytes_count
                    except RequestException:
                        continue
            
            if total_bytes > 0:
                language_percentages = {
                    lang: round((bytes_count / total_bytes) * 100, 1)
                    for lang, bytes_count in sorted(
                        language_bytes.items(), 
                        key=lambda x: x[1], 
                        reverse=True
                    )[:6]
                }
                return language_percentages
            
            return {"Python": 35, "TypeScript": 28, "JavaScript": 20, "Java": 17}
            
        except RequestException as e:
            logger.error(f"Failed to fetch language stats: {e}")
            return {"Python": 35, "TypeScript": 28, "JavaScript": 20, "Java": 17}
    
    def generate_project_showcase_svg(
        self,
        projects: List[Dict[str, Any]],
        output_path: str
    ) -> None:
        """Generate project showcase SVG with real data."""
        
        svg_template = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 300" preserveAspectRatio="xMidYMid meet">
  <defs>
    <linearGradient id="techBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a192f;stop-opacity:0.95"/>
      <stop offset="50%" style="stop-color:#112240;stop-opacity:0.95"/>
      <stop offset="100%" style="stop-color:#0a192f;stop-opacity:0.95"/>
    </linearGradient>
    
    <linearGradient id="rainbowBorder" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#ff6b6b;stop-opacity:1">
        <animate attributeName="stop-color" values="#ff6b6b;#4ecdc4;#45b7d1;#96ceb4;#ffeaa7;#ff6b6b" dur="8s" repeatCount="indefinite"/>
      </stop>
      <stop offset="100%" style="stop-color:#ffeaa7;stop-opacity:1">
        <animate attributeName="stop-color" values="#ffeaa7;#ff6b6b;#4ecdc4;#45b7d1;#96ceb4;#ffeaa7" dur="8s" repeatCount="indefinite"/>
      </stop>
    </linearGradient>
    
    <filter id="rainbowGlow">
      <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <rect x="10" y="10" width="460" height="280" rx="20" ry="20" fill="url(#techBg)" stroke="url(#rainbowBorder)" stroke-width="3" filter="url(#rainbowGlow)"/>
  
  <text x="240" y="50" text-anchor="middle" fill="#58a6ff" font-size="20" font-weight="bold" font-family="Arial, sans-serif">
    🚀 Featured Projects
  </text>
  
  <line x1="40" y1="70" x2="440" y2="70" stroke="#30363d" stroke-width="1"/>
  
  {project_cards}
  
  <text x="240" y="210" text-anchor="middle" fill="#c9d1d9" font-size="12" font-family="Arial, sans-serif">
    📊 Total Projects: {total_projects}
  </text>
  
  <text x="240" y="235" text-anchor="middle" fill="#c9d1d9" font-size="12" font-family="Arial, sans-serif">
    🌟 Total Stars: {total_stars}
  </text>
  
  <text x="240" y="260" text-anchor="middle" fill="#c9d1d9" font-size="12" font-family="Arial, sans-serif">
    🍴 Total Forks: {total_forks}
  </text>
  
  <a href="https://github.com/badhope?tab=repositories">
    <text x="240" y="285" text-anchor="middle" fill="#58a6ff" font-size="11" font-family="Arial, sans-serif" style="cursor: pointer;">
      View All Projects →
    </text>
  </a>
</svg>'''
        
        project_cards = []
        total_stars = 0
        total_forks = 0
        
        for i, project in enumerate(projects[:2]):
            x_offset = 30 + (i * 220)
            stars = project.get("stars", 0)
            forks = project.get("forks", 0)
            total_stars += stars
            total_forks += forks
            
            language = project.get("language", "Unknown")
            description = project.get("description", "")[:25]
            
            card = f'''<rect x="{x_offset}" y="90" width="200" height="90" rx="10" fill="#161b22" stroke="#30363d" stroke-width="1"/>
  <text x="{x_offset + 100}" y="115" text-anchor="middle" fill="#58a6ff" font-size="14" font-weight="bold" font-family="Arial, sans-serif">
    {project.get("name", "Project")}
  </text>
  <text x="{x_offset + 100}" y="135" text-anchor="middle" fill="#8b949e" font-size="10" font-family="Arial, sans-serif">
    {description}
  </text>
  <text x="{x_offset + 100}" y="155" text-anchor="middle" fill="#c9d1d9" font-size="11" font-family="Arial, sans-serif">
    ⭐ Stars: {stars}
  </text>
  <text x="{x_offset + 100}" y="170" text-anchor="middle" fill="#8b949e" font-size="9" font-family="Arial, sans-serif">
    {language}
  </text>'''
            project_cards.append(card)
        
        svg_content = svg_template.format(
            project_cards="\n  ".join(project_cards),
            total_projects=len(projects),
            total_stars=total_stars,
            total_forks=total_forks
        )
        
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(svg_content)
        
        logger.info(f"Generated project showcase SVG: {output_path}")
    
    def generate_stats_panel_svg(
        self,
        language_stats: Dict[str, float],
        output_path: str
    ) -> None:
        """Generate stats panel SVG with language distribution."""
        
        svg_template = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 350" preserveAspectRatio="xMidYMid meet">
  <defs>
    <radialGradient id="panelBg" cx="50%" cy="50%" r="70%">
      <stop offset="0%" style="stop-color:#1c2128;stop-opacity:0.95"/>
      <stop offset="100%" style="stop-color:#0d1117;stop-opacity:0.98"/>
    </radialGradient>
    
    <linearGradient id="neonBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00ff88;stop-opacity:0.9">
        <animate attributeName="stop-color" values="#00ff88;#00ccff;#ff00ff;#00ff88" dur="6s" repeatCount="indefinite"/>
      </stop>
      <stop offset="100%" style="stop-color:#ff00ff;stop-opacity:0.9">
        <animate attributeName="stop-color" values="#ff00ff;#00ff88;#00ccff;#ff00ff" dur="6s" repeatCount="indefinite"/>
      </stop>
    </linearGradient>
    
    <filter id="neonGlow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <rect x="15" y="15" width="470" height="320" rx="25" ry="25" fill="url(#panelBg)" stroke="url(#neonBorder)" stroke-width="3" filter="url(#neonGlow)"/>
  
  <text x="250" y="55" text-anchor="middle" fill="#58a6ff" font-size="20" font-weight="bold" font-family="Arial, sans-serif">
    💻 Tech Stack Overview
  </text>
  
  <line x1="50" y1="75" x2="450" y2="75" stroke="#30363d" stroke-width="1"/>
  
  <text x="50" y="110" fill="#c9d1d9" font-size="14" font-weight="bold" font-family="Arial, sans-serif">
    Languages
  </text>
  
  {language_bars}
  
  <text x="50" y="170" fill="#c9d1d9" font-size="14" font-weight="bold" font-family="Arial, sans-serif">
    Frameworks
  </text>
  
  <text x="50" y="195" fill="#8b949e" font-size="12" font-family="Arial, sans-serif">
    • FastAPI • React • Vue.js • Node.js • Express
  </text>
  
  <text x="50" y="230" fill="#c9d1d9" font-size="14" font-weight="bold" font-family="Arial, sans-serif">
    AI & ML
  </text>
  
  <text x="50" y="255" fill="#8b949e" font-size="12" font-family="Arial, sans-serif">
    • PyTorch • LangChain • Hugging Face • OpenAI
  </text>
  
  <text x="50" y="290" fill="#c9d1d9" font-size="14" font-weight="bold" font-family="Arial, sans-serif">
    Tools
  </text>
  
  <text x="50" y="315" fill="#8b949e" font-size="12" font-family="Arial, sans-serif">
    • Docker • Git • Linux • AWS • MongoDB • Redis
  </text>
</svg>'''
        
        language_colors = {
            "Python": "#3776AB",
            "TypeScript": "#3178C6",
            "JavaScript": "#F7DF1E",
            "Java": "#007396",
            "Go": "#00ADD8",
            "Rust": "#DEA584",
            "C++": "#00599C",
            "C#": "#239120",
            "Swift": "#FA7343",
            "Kotlin": "#A97BFF"
        }
        
        language_bars = []
        y_offset = 120
        
        for lang, percentage in list(language_stats.items())[:6]:
            color = language_colors.get(lang, "#8b949e")
            bar_width = min(int(percentage * 3.5), 300)
            
            bar = f'''<rect x="50" y="{y_offset}" width="{bar_width}" height="20" rx="3" fill="{color}" opacity="0.8"/>
  <text x="{50 + bar_width/2}" y="{y_offset + 14}" text-anchor="middle" fill="#ffffff" font-size="11" font-family="Arial, sans-serif">{lang} {percentage}%</text>'''
            language_bars.append(bar)
            y_offset += 25
        
        svg_content = svg_template.format(
            language_bars="\n  ".join(language_bars)
        )
        
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(svg_content)
        
        logger.info(f"Generated stats panel SVG: {output_path}")


def main():
    """Main entry point."""
    logger.info("=" * 60)
    logger.info("🎨 Dynamic SVG Generator")
    logger.info("=" * 60)
    
    generator = SVGGenerator()
    
    projects = [
        {"name": "-thinkcheck-lib-", "repo": "-thinkcheck-lib-"},
        {"name": "MindMirror", "repo": "MindMirror"},
        {"name": "DevFlow-Agent", "repo": "DevFlow-Agent"},
        {"name": "AgentHome", "repo": "AgentHome"}
    ]
    
    logger.info("📡 Fetching project statistics...")
    for project in projects:
        try:
            stats = generator.fetch_repo_stats("badhope", project["repo"])
            project.update(stats)
            logger.info(f"✓ {project['name']}: ⭐{stats.get('stars', 0)} forks:{stats.get('forks', 0)}")
        except Exception as e:
            logger.error(f"✗ Failed to fetch {project['name']}: {e}")
    
    output_dir = os.path.join(os.path.dirname(__file__), "..", "assets", "effects")
    os.makedirs(output_dir, exist_ok=True)
    
    logger.info("🎨 Generating project showcase SVG...")
    generator.generate_project_showcase_svg(
        projects,
        os.path.join(output_dir, "project-showcase.svg")
    )
    
    logger.info("📊 Fetching language statistics...")
    language_stats = generator.fetch_language_stats("badhope")
    
    logger.info("🎨 Generating stats panel SVG...")
    generator.generate_stats_panel_svg(
        language_stats,
        os.path.join(output_dir, "stats-panel.svg")
    )
    
    logger.info("✨ SVG generation complete!")


if __name__ == "__main__":
    main()
