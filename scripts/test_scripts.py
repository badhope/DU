#!/usr/bin/env python3
"""
测试脚本 - 验证自动化脚本的核心功能
"""

import unittest
import os
import sys
import tempfile
from unittest.mock import patch, MagicMock

# 添加脚本目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestUpdateProjects(unittest.TestCase):
    """测试项目更新脚本"""

    def test_config_from_env(self):
        """测试从环境变量读取配置"""
        with patch.dict(os.environ, {'GITHUB_USERNAME': 'testuser', 'PROJECTS_LIMIT': '5'}):
            from scripts.update_projects import USERNAME, DEFAULT_LIMIT
            self.assertEqual(USERNAME, 'testuser')
            self.assertEqual(DEFAULT_LIMIT, 5)

    def test_default_config(self):
        """测试默认配置"""
        # 先删除可能存在的环境变量
        env_vars_to_remove = ['GITHUB_USERNAME', 'PROJECTS_LIMIT']
        original_values = {}
        
        for var in env_vars_to_remove:
            if var in os.environ:
                original_values[var] = os.environ.pop(var)
        
        try:
            # 重新导入以获取默认值
            import importlib
            if 'scripts.update_projects' in sys.modules:
                del sys.modules['scripts.update_projects']
            
            from scripts.update_projects import USERNAME, DEFAULT_LIMIT
            self.assertEqual(USERNAME, 'badhope')
            self.assertEqual(DEFAULT_LIMIT, 4)
        finally:
            # 恢复环境变量
            for var, value in original_values.items():
                os.environ[var] = value


class TestUpdateBlog(unittest.TestCase):
    """测试博客更新脚本"""

    def test_format_blog_markdown(self):
        """测试博客内容格式化"""
        from scripts.update_blog import format_blog_markdown
        
        posts = [
            {'title': 'Test Post', 'url': 'http://test.com', 'source': 'CSDN', 'date': '2026-05-27'}
        ]
        
        result = format_blog_markdown(posts)
        self.assertIn('Test Post', result)
        self.assertIn('http://test.com', result)
        self.assertIn('2026-05-27', result)

    def test_format_blog_empty(self):
        """测试空博客列表"""
        from scripts.update_blog import format_blog_markdown
        
        result = format_blog_markdown([])
        self.assertIn('文章同步中', result)


class TestUpdateQuote(unittest.TestCase):
    """测试名言更新脚本"""

    def test_format_quote(self):
        """测试名言格式化"""
        from scripts.update_quote import format_quote_markdown
        
        quote = {'text': 'Test quote', 'author': 'Test Author'}
        result = format_quote_markdown(quote)
        
        self.assertIn('Test quote', result)
        self.assertIn('Test Author', result)

    def test_format_quote_no_author(self):
        """测试无名言作者"""
        from scripts.update_quote import format_quote_markdown
        
        quote = {'text': 'Test quote', 'author': ''}
        result = format_quote_markdown(quote)
        
        self.assertIn('Test quote', result)
        self.assertNotIn('—', result)


class TestHelpers(unittest.TestCase):
    """测试辅助函数"""

    def test_read_write_readme(self):
        """测试读写README文件"""
        from scripts.helpers import read_readme, write_readme, get_readme_path
        
        # 创建临时文件进行测试
        with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False) as f:
            temp_path = f.name
            f.write('# Test\n\nTest content')
        
        # 测试写入
        test_content = '# Test\n\nUpdated content'
        write_readme(test_content)
        
        # 测试读取
        content = read_readme()
        self.assertIn('Updated content', content)
        
        # 清理
        os.unlink(temp_path)

    def test_truncate_text(self):
        """测试文本截断"""
        from scripts.helpers import truncate_text
        
        text = 'Hello World'
        result = truncate_text(text, 5)
        self.assertEqual(result, 'He...')
        self.assertEqual(len(result), 5)


class TestConfig(unittest.TestCase):
    """测试配置模块"""

    def test_get_config(self):
        """测试获取配置"""
        from scripts.config import get_config
        
        config = get_config()
        
        # 验证配置结构
        self.assertTrue(hasattr(config, 'blog'))
        self.assertTrue(hasattr(config, 'quote'))
        self.assertTrue(hasattr(config.blog, 'csdn_user_id'))
        self.assertTrue(hasattr(config.blog, 'max_posts'))

    def test_safe_int(self):
        """测试安全整数转换"""
        from scripts.config import _safe_int
        
        self.assertEqual(_safe_int('10', 5), 10)
        self.assertEqual(_safe_int(None, 5), 5)
        self.assertEqual(_safe_int('abc', 5), 5)


class TestIntegration(unittest.TestCase):
    """集成测试"""

    def test_all_scripts_import(self):
        """测试所有脚本都能正确导入"""
        # 测试所有脚本导入
        try:
            import scripts.update_projects
            import scripts.update_blog
            import scripts.update_quote
            import scripts.config
            import scripts.helpers
            import scripts.generate_svg
        except ImportError as e:
            self.fail(f"脚本导入失败: {e}")


def run_tests():
    """运行所有测试"""
    print("🚀 开始运行测试...")
    
    # 创建测试套件
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # 添加测试类
    suite.addTests(loader.loadTestsFromTestCase(TestUpdateProjects))
    suite.addTests(loader.loadTestsFromTestCase(TestUpdateBlog))
    suite.addTests(loader.loadTestsFromTestCase(TestUpdateQuote))
    suite.addTests(loader.loadTestsFromTestCase(TestHelpers))
    suite.addTests(loader.loadTestsFromTestCase(TestConfig))
    suite.addTests(loader.loadTestsFromTestCase(TestIntegration))
    
    # 运行测试
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # 输出总结
    print("\n" + "="*60)
    print(f"测试完成: {result.testsRun} 个测试")
    print(f"失败: {len(result.failures)}")
    print(f"错误: {len(result.errors)}")
    print("="*60)
    
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)