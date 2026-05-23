#!/usr/bin/env python3
"""
自动获取 GitHub 星星最高的项目并更新 README.md
"""

import requests
import re
import logging
from typing import List, Dict

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

GITHUB_API_URL = "https://api.github.com"
USERNAME = "badhope"


def get_top_repos(limit: int = 4) -> List[Dict]:
    """
    获取星星最高的仓库（只获取原创项目，过滤掉fork的）
    
    Args:
        limit: 返回的仓库数量
        
    Returns:
        仓库信息列表
    """
    url = f"{GITHUB_API_URL}/users/{USERNAME}/repos"
    params = {
        "sort": "stargazers",
        "per_page": 100,  # 获取更多以确保有足够的原创项目
        "type": "owner"
    }
    
    headers = {}
    if token := __import__('os').environ.get('GITHUB_TOKEN'):
        headers['Authorization'] = f'token {token}'
    
    try:
        response = requests.get(url, params=params, headers=headers, timeout=30)
        response.raise_for_status()
        all_repos = response.json()
        
        # 只保留原创项目（fork=False）
        own_repos = [repo for repo in all_repos if not repo['fork']]
        repos = sorted(own_repos, key=lambda x: x['stargazers_count'], reverse=True)[:limit]
        
        logger.info(f"成功获取 {len(repos)} 个原创项目（已过滤 fork 的项目）")
        
        return [
            {
                "name": repo['name'],
                "full_name": repo['full_name'],
                "description": repo['description'] or "No description",
                "url": repo['html_url'],
                "stars": repo['stargazers_count'],
                "language": repo['language'] or "N/A"
            }
            for repo in repos
        ]
        
    except requests.RequestException as e:
        logger.error(f"获取项目失败: {e}")
        return []


def format_project_card(repo: Dict, index: int) -> str:
    """
    格式化单个项目卡片
    
    Args:
        repo: 项目信息字典
        index: 项目索引
        
    Returns:
        格式化的 Markdown 字符串
    """
    return f"""### [{repo['name']}]({repo['url']})

{repo['description']}

![Stars](https://img.shields.io/github/stars/{repo['full_name']}?style=flat-square&color=58a6ff)
![Language](https://img.shields.io/github/languages/top/{repo['full_name']}?style=flat-square&color=3776AB)
![Last Commit](https://img.shields.io/github/last-commit/{repo['full_name']}?style=flat-square&color=c9d1d9)"""


def update_readme_projects() -> bool:
    """
    更新 README.md 中的特色项目部分
    
    Returns:
        是否更新成功
    """
    try:
        with open('README.md', 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        logger.error("README.md 文件未找到")
        return False
    except Exception as e:
        logger.error(f"读取文件失败: {e}")
        return False
    
    repos = get_top_repos(limit=4)
    
    if not repos:
        logger.warning("未能获取项目列表，跳过更新")
        return False
    
    rows = []
    for i in range(0, len(repos), 2):
        left = format_project_card(repos[i], i)
        
        if i + 1 < len(repos):
            right = format_project_card(repos[i + 1], i + 1)
        else:
            right = ""
        
        rows.append(f"""<tr>
<td width="50%">

{left}

</td>
<td width="50%">

{right}

</td>
</tr>""")
    
    projects_md = "<table>\n" + "\n".join(rows) + "\n</table>"
    
    pattern = r'<!-- projects:start -->.*?<!-- projects:end -->'
    replacement = f'<!-- projects:start -->\n\n{projects_md}\n\n<!-- projects:end -->'
    
    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    if new_content == content:
        logger.warning("未能找到项目标记或内容未变化")
        return False
    
    try:
        with open('README.md', 'w', encoding='utf-8') as f:
            f.write(new_content)
        logger.info("✅ README.md 项目部分更新成功")
        return True
    except Exception as e:
        logger.error(f"写入文件失败: {e}")
        return False


if __name__ == "__main__":
    logger.info("🚀 开始更新特色项目...")
    update_readme_projects()
