# plugin-postSpeech

这是一个基于 Halo 的语音朗读插件，旨在为您的文章添加语音播放功能，提升用户体验。
## 演示站

https://www.lik.cc/

## 功能特性

- **文章语音朗读**: 将文章内容转换为语音进行播放。
- **自定义播放速度**: 用户可调节语音播放的速度。
- **UI 样式可配置**: 可通过修改 CSS 文件定制播放按钮和进度条的样式。
- **路由匹配启用**: 可配置插件只在特定路由下启用。
- **PJAX 兼容**: 支持 PJAX 页面导航。
- **轻量无依赖**: 插件前端无任何外部依赖库，仅使用浏览器内置的 Speech Synthesis API 实现语音功能。

## 使用方法

插件启用后，在符合配置条件的页面上，页面边缘会显示一个语音朗读按钮。点击按钮即可开始朗读文章内容。

## 自定义

您可以修改 `src/main/resources/static/css/likcc-speech.css` 文件来定制插件的 UI 样式，包括按钮颜色、大小、位置、进度条样式等。修改后需要重新构建插件。

## 文档
详细的使用文档：https://docs.lik.cc/

## 交流群
![QQ群](https://www.lik.cc/upload/QQ%E7%BE%A4.png)


## 开发环境

插件开发的详细文档请查阅：<https://docs.halo.run/developer-guide/plugin/introduction>

所需环境：

1. Java 17
2. Node 20
3. pnpm 9
4. Docker (可选)

克隆项目：

```bash
git clone git@github.com:acanyo/plugin-postSpeech.git

# 或者当你 fork 之后

git clone git@github.com:{your_github_id}/plugin-postSpeech.git
```

```bash
cd path/to/plugin-postSpeech
```

### 运行方式 1（推荐）

> 此方式需要本地安装 Docker

```bash
# macOS / Linux
./gradlew pnpmInstall

# Windows
./gradlew.bat pnpmInstall
```

```bash
# macOS / Linux
./gradlew haloServer

# Windows
./gradlew.bat haloServer
```

执行此命令后，会自动创建一个 Halo 的 Docker 容器并加载当前的插件，更多文档可查阅：<https://docs.halo.run/developer-guide/plugin/basics/devtools>

### 运行方式 2

> 此方式需要使用源码运行 Halo

编译插件：

```bash
# macOS / Linux
./gradlew build

# Windows
./gradlew.bat build
```

修改 Halo 配置文件：

```yaml
halo:
  plugin:
    runtime-mode: development
    fixedPluginPath:
      - "/path/to/plugin-starter"
```

最后重启 Halo 项目即可。
