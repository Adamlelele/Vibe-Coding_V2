# 战略投资研究终端 - Vercel 静态版

这是专门为 GitHub + Vercel 一键部署准备的静态网页版本。

它不依赖 Python、Streamlit 或后端服务，所以可以直接按照：

1. 上传到 GitHub Public repository
2. Vercel Import Project
3. Framework Preset 选择 `Other`
4. 点击 Deploy

来部署。

## 文件说明

- `index.html`：网页入口。
- `assets/styles.css`：页面样式。
- `assets/script.js`：页面交互和数据渲染逻辑。
- `assets/data.js`：从原 Streamlit 项目导出的静态数据。

## 注意

部署到 Vercel 时，请只上传这个文件夹里的内容。

不要把原来的 Streamlit 项目一起上传，否则 Vercel 会看到 `app.py`，继续把它当成 Python Function 构建并报错。
