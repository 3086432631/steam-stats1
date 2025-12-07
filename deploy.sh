#!/bin/bash

# Steam Stats 部署脚本
# 用于自动化部署到 Vercel

echo "🎮 Steam Stats 部署脚本"
echo "======================"

# 检查 Node.js 版本
node_version=$(node --version)
echo "Node.js 版本: $node_version"

# 检查 npm 版本
npm_version=$(npm --version)
echo "npm 版本: $npm_version"

# 安装依赖
echo ""
echo "📦 安装依赖..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

# 检查环境变量文件
if [ ! -f ".env.local" ]; then
    echo ""
    echo "⚠️  未找到 .env.local 文件"
    echo "请复制 .env.example 为 .env.local 并配置相关密钥"
    
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        echo "已创建 .env.local 模板文件，请编辑后重新运行"
    fi
    exit 1
fi

# 构建测试
echo ""
echo "🔨 构建测试..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    exit 1
fi

# 检查 Vercel CLI
echo ""
echo "🔍 检查 Vercel CLI..."
if ! command -v vercel &> /dev/null; then
    echo "📥 安装 Vercel CLI..."
    npm install -g vercel
fi

# 部署到 Vercel
echo ""
echo "🚀 开始部署到 Vercel..."
echo "请选择部署方式:"
echo "1. 生产部署 (Production)"
echo "2. 预览部署 (Preview)"
echo "3. 取消"

read -p "请输入选项 (1-3): " deploy_choice

case $deploy_choice in
    1)
        echo ""
        echo "🌟 开始生产部署..."
        vercel --prod
        ;;
    2)
        echo ""
        echo "🔍 开始预览部署..."
        vercel
        ;;
    3)
        echo ""
        echo "❌ 取消部署"
        exit 0
        ;;
    *)
        echo ""
        echo "❌ 无效选项，取消部署"
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 部署成功！"
    echo ""
    echo "📋 部署后检查清单:"
    echo "   1. 检查 Vercel 仪表板中的函数日志"
    echo "   2. 确认环境变量已正确设置"
    echo "   3. 测试 Steam 登录功能"
    echo "   4. 测试 AI 分析功能"
    echo ""
    echo "🔧 如需设置环境变量，请使用:"
    echo "   vercel env add STEAM_API_KEY"
    echo "   vercel env add GOOGLE_GEMINI_API_KEY"
    echo "   vercel env add NEXTAUTH_SECRET"
    echo "   vercel env add NEXTAUTH_URL"
else
    echo ""
    echo "❌ 部署失败"
    echo "请检查错误信息并重新尝试"
fi