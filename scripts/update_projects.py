#!/usr/bin/env python3
"""
自动获取 GitHub 仓库信息并更新 README.md
支持灵活配置，适应仓库名称和描述的变化
"""

import requests
import re
import logging
import os
import time
from typing import List, Dict, Optional
from functools import wraps

logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# 从环境变量获取配置，支持灵活配置
GITHUB_API_URL = os.environ.get("GITHUB_API_URL", "https://api.github.com")
USERNAME = os.environ.get("GITHUB_USERNAME", "badhope")
DEFAULT_LIMIT = int(os.environ.get("PROJECTS_LIMIT", "4"))


def retry_on_failure(max_retries: int = 3, delay: float = 2.0):
    """装饰器：失败时重试"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    logger.warning(f"尝试 {attempt + 1}/{max_retries} 失败: {e}")
                    if attempt < max_retries - 1:
                        time.sleep(delay * (attempt + 1))
            logger.error(f"所有 {max_retries} 次尝试均失败")
            raise last_exception
        return wrapper
    return decorator


@retry_on_failure(max_retries=3, delay=2.0)
def get_top_repos(limit: int = DEFAULT_LIMIT) -> List[Dict]:
    """
    获取星星最高的仓库（只获取原创项目，过滤掉fork的）
    
    Args:
        limit: 返回的仓库数量
        
    Returns:
        仓库信息列表
    """
    url = f"{GITHUB_API_URL}/users/{USERNAME}/repos"
    
    # 支持分页获取所有仓库
    params = {
        "sort": "stargazers",
        "per_page": 100,
        "type": "owner"
    }
    
    headers = {}
    if token := os.environ.get('GITHUB_TOKEN'):
        headers['Authorization'] = f'token {token}'
        logger.info("已使用 GitHub Token 进行认证")
    
    try:
        all_repos = []
        page = 1
        
        # 分页获取所有仓库
        while True:
            params['page'] = page
            response = requests.get(url, params=params, headers=headers, timeout=30)
            response.raise_for_status()
            
            repos = response.json()
            if not repos:
                break
            
            all_repos.extend(repos)
            page += 1
            
            # 检查是否还有更多页面
            link_header = response.headers.get('Link', '')
            if 'rel="next"' not in link_header:
                break
        
        # 只保留原创项目（fork=False）
        own_repos = [repo for repo in all_repos if not repo.get('fork', False)]
        
        # 按星星数排序
        repos = sorted(own_repos, key=lambda x: x.get('stargazers_count', 0), reverse=True)[:limit]
        
        logger.info(f"成功获取 {len(repos)} 个原创项目（共 {len(own_repos)} 个原创项目）")
        
        result = []
        for repo in repos:
            # 获取更多仓库信息
            result.append({
                "name": repo.get('name', ''),
                "full_name": repo.get('full_name', ''),
                "description": repo.get('description') or "暂无描述",
                "url": repo.get('html_url', ''),
                "stars": repo.get('stargazers_count', 0),
                "language": repo.get('language') or "N/A",
                "forks": repo.get('forks_count', 0),
                "updated_at": repo.get('updated_at', '')[:10] if repo.get('updated_at') else "",
                "license": repo.get('license', {}).get('name', 'N/A') if repo.get('license') else 'N/A',
                "topics": repo.get('topics', []),
                "archived": repo.get('archived', False)
            })
        
        return result
        
    except requests.RequestException as e:
        logger.error(f"获取项目失败: {e}")
        raise


def format_project_card(repo: Dict) -> str:
    """
    格式化单个项目卡片
    
    Args:
        repo: 项目信息字典
        
    Returns:
        格式化的 Markdown 字符串
    """
    # 跳过归档项目
    if repo.get('archived'):
        return ""
    
    # 构建标签
    tags = []
    if repo.get('topics'):
        tags.extend(repo['topics'][:3])  # 最多显示3个标签
    
    tags_str = ""
    if tags:
        tags_str = "\n\n**标签**: " + ", ".join([f"`{tag}`" for tag in tags])
    
    return f"""### [{repo['name']}]({repo['url']})

{repo['description']}{tags_str}

![Stars](https://img.shields.io/github/stars/{repo['full_name']}?style=flat-square&color=58a6ff)
![Language](https://img.shields.io/github/languages/top/{repo['full_name']}?style=flat-square&color=3776AB)
![Forks](https://img.shields.io/github/forks/{repo['full_name']}?style=flat-square&color=93c5fd)
![Last Commit](https://img.shields.io/github/last-commit/{repo['full_name']}?style=flat-square&color=c9d1d9)"""


def update_readme_projects(readme_path: str = "README.md") -> bool:
    """
    更新 README.md 中的特色项目部分
    
    Args:
        readme_path: README 文件路径
        
    Returns:
        是否更新成功
    """
    try:
        with open(readme_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        logger.error(f"README.md 文件未找到: {readme_path}")
        return False
    except Exception as e:
        logger.error(f"读取文件失败: {e}")
        return False
    
    try:
        repos = get_top_repos(limit=DEFAULT_LIMIT)
    except Exception as e:
        logger.error(f"获取仓库列表失败: {e}")
        return False
    
    if not repos:
        logger.warning("未能获取项目列表，跳过更新")
        return False
    
    # 过滤归档项目
    active_repos = [repo for repo in repos if not repo.get('archived')]
    
    rows = []
    for i in range(0, len(active_repos), 2):
        left = format_project_card(active_repos[i])
        
        if i + 1 < len(active_repos):
            right = format_project_card(active_repos[i + 1])
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
        logger.info("项目内容未变化，无需更新")
        return False
    
    try:
        with open(readme_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        logger.info("✅ README.md 项目部分更新成功")
        return True
    except Exception as e:
        logger.error(f"写入文件失败: {e}")
        return False


def main():
    """主入口"""
    logger.info("🚀 开始更新特色项目...")
    logger.info(f"配置: 用户名={USERNAME}, 限制数量={DEFAULT_LIMIT}")
    
    success = update_readme_projects()
    
    if success:
        logger.info("✅ 项目更新完成")
    else:
        logger.error("❌ 项目更新失败")


if __name__ == "__main__":
    main()