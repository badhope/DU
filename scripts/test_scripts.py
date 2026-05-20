#!/usr/bin/env python3
"""
Unit tests for profile README automation scripts.
"""

import pytest
from unittest.mock import Mock, patch, mock_open
from scripts.helpers_v2 import (
    read_readme, write_readme, update_section,
    truncate_text, sanitize_filename, READMEError
)
from scripts.config import get_config, BlogConfig, QuoteConfig


class TestHelpers:
    """Test helper functions."""
    
    def test_truncate_text_short(self):
        """Test truncate with short text."""
        text = "Short text"
        result = truncate_text(text, max_length=20)
        assert result == text
    
    def test_truncate_text_long(self):
        """Test truncate with long text."""
        text = "This is a very long text that needs to be truncated"
        result = truncate_text(text, max_length=20)
        assert len(result) == 20
        assert result.endswith("...")
    
    def test_sanitize_filename(self):
        """Test filename sanitization."""
        assert sanitize_filename("test file.txt") == "test-file.txt"
        assert sanitize_filename("test@file#.txt") == "testfile.txt"
    
    @patch("scripts.helpers_v2.Path.read_text")
    def test_read_readme_success(self, mock_read):
        """Test successful README read."""
        mock_read.return_value = "# Test README"
        result = read_readme()
        assert result == "# Test README"
    
    @patch("scripts.helpers_v2.Path.read_text")
    def test_read_readme_not_found(self, mock_read):
        """Test README not found."""
        mock_read.side_effect = FileNotFoundError()
        with pytest.raises(READMEError):
            read_readme()
    
    @patch("scripts.helpers_v2.Path.write_text")
    def test_write_readme_success(self, mock_write):
        """Test successful README write."""
        write_readme("# Test")
        mock_write.assert_called_once()
    
    def test_update_section_found(self):
        """Test section update when pattern found."""
        content = "<!-- start -->\nOld content\n<!-- end -->"
        pattern = r'(<!-- start -->)\n.*?\n(<!-- end -->)'
        replacement = r'\1\nNew content\n\2'
        result = update_section(pattern, replacement, content)
        assert "New content" in result
    
    def test_update_section_not_found(self):
        """Test section update when pattern not found."""
        content = "Some content"
        pattern = r'<!-- start -->.*?<!-- end -->'
        replacement = "New content"
        result = update_section(pattern, replacement, content)
        assert result == content


class TestConfig:
    """Test configuration management."""
    
    def test_get_config_defaults(self):
        """Test default configuration."""
        config = get_config()
        assert isinstance(config.blog, BlogConfig)
        assert isinstance(config.quote, QuoteConfig)
        assert config.blog.max_posts == 3
        assert config.blog.timeout == 10
        assert config.blog.juejin_user_id == ""
        assert "juejin.cn" in config.blog.juejin_api_url
    
    @patch.dict("os.environ", {"MAX_POSTS": "5", "REQUEST_TIMEOUT": "15", "JUEJIN_USER_ID": "test123"})
    def test_get_config_from_env(self):
        """Test configuration from environment."""
        config = get_config()
        assert config.blog.max_posts == 5
        assert config.blog.timeout == 15
        assert config.blog.juejin_user_id == "test123"


class TestBlogSync:
    """Test blog sync functions."""
    
    @patch("scripts.update_blog_v2.requests.get")
    def test_fetch_csdn_posts_success(self, mock_get):
        """Test successful CSDN fetch."""
        from scripts.update_blog_v2 import fetch_csdn_posts
        from scripts.config import get_config
        
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.content = b'''<?xml version="1.0"?>
            <rss>
                <item>
                    <title>Test Post</title>
                    <link>https://example.com/post</link>
                    <pubDate>2024-01-01</pubDate>
                </item>
            </rss>
        '''
        mock_get.return_value = mock_response
        
        config = get_config()
        posts = fetch_csdn_posts(config.blog, limit=1)
        
        assert len(posts) == 1
        assert posts[0]["title"] == "Test Post"
    
    @patch("scripts.update_blog_v2.requests.post")
    def test_fetch_juejin_posts_success(self, mock_post):
        """Test successful Juejin fetch."""
        from scripts.update_blog_v2 import fetch_juejin_posts
        from scripts.config import get_config
        
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "err_msg": "success",
            "data": [
                {
                    "article_id": "123",
                    "article_info": {
                        "title": "Test Article",
                        "mtime": "2024-01-01"
                    }
                }
            ]
        }
        mock_post.return_value = mock_response
        
        config = get_config()
        posts = fetch_juejin_posts(config.blog, limit=1)
        
        assert len(posts) == 1
        assert posts[0]["title"] == "Test Article"


class TestQuoteUpdate:
    """Test quote update functions."""
    
    def test_format_quote_markdown(self):
        """Test quote formatting."""
        from scripts.update_quote_v2 import format_quote_markdown
        
        quote = {
            "text": "Test quote",
            "author": "Test Author"
        }
        result = format_quote_markdown(quote)
        
        assert "Test quote" in result
        assert "✨ 每日星语" in result
    
    @patch("scripts.update_quote_v2.requests.get")
    def test_fetch_quote_from_api(self, mock_get):
        """Test quote fetch from API."""
        from scripts.update_quote_v2 import fetch_quote_from_api
        
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = [
            {"q": "Test quote", "a": "Test Author"}
        ]
        mock_get.return_value = mock_response
        
        result = fetch_quote_from_api("https://example.com/api", timeout=10)
        
        assert result["text"] == "Test quote"
        assert result["author"] == "Test Author"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
