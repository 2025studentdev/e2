---
title: Windows 11 下开始学习 Python：环境安装与 PyCharm 配置
order: 1
---
在 Windows 11 上开始学习 Python，可以按“安装 Python、安装 PyCharm、运行第一个程序”的顺序完成。编辑器推荐使用 **PyCharm Community Edition**，它免费、功能完整，代码提示和调试体验较好，适合新手长期使用。

## 一、安装 Python

先打开 PowerShell，输入以下命令检查是否已安装 Python：

```powershell
python --version
```

或：

```powershell
py --version
```

如果能看到版本号，说明电脑中可能已经安装了 Python。如果系统直接跳转到 Microsoft Store，通常说明只是占位程序，并没有真正安装。

推荐从 Python 官网下载 Windows 64 位安装包。双击运行后，在安装界面第一步务必勾选：

```text
Add python.exe to PATH
```

然后点击 `Install Now` 完成安装。

安装结束后，关闭并重新打开 PowerShell，输入：

```powershell
python --version
pip --version
```

如果两个命令都能显示版本信息，说明 Python 安装成功。

## 二、安装 PyCharm

到 JetBrains 官网下载 **PyCharm Community Edition**。这是免费版本，足够日常 Python 学习使用。

安装过程中可以保持默认选项，建议勾选创建桌面快捷方式和关联 `.py` 文件。

第一次启动 PyCharm 后，选择 `New Project` 新建项目。项目位置可以选择一个专门存放代码的文件夹。解释器类型选择 `Project venv`，也就是项目虚拟环境。`Base interpreter` 选择刚才安装的 Python。

如果列表中没有自动出现 Python，可以点击 `Add Interpreter`，选择 `System Interpreter`，然后浏览到 Python 安装目录中的 `python.exe`。

使用虚拟环境的好处是：每个项目的第三方库互相隔离，以后学习不同内容时不容易出现版本冲突。

## 三、运行第一个程序

项目创建完成后，在项目中新建一个 Python 文件，例如 `main.py`，输入：

```python
print("Hello, World!")
```

然后点击右上角的运行按钮。如果下方运行窗口输出：

```text
Hello, World!
```

说明 Python 和 PyCharm 已经配置正常。

## 四、后续学习建议

开始阶段不用贪多，先掌握以下核心概念：

- 变量
- 字符串
- 列表
- 字典
- 条件判断
- 循环
- 函数

每学一个概念，就在 PyCharm 中写几行代码验证。例如：

- 用循环打印数字
- 用列表保存名字
- 用函数封装简单计算

PyCharm 的代码提示和调试功能可以帮助你更快理解程序运行过程。

## 五、两个常见概念

### 1. pip

`pip` 是 Python 的包管理工具，安装 Python 时通常已经自带。需要第三方库时，可以在 PyCharm 底部的 `Terminal` 中输入：

```powershell
python -m pip install 包名
```

### 2. 虚拟环境

建议每个项目单独使用虚拟环境。PyCharm 新建项目时默认可以创建虚拟环境，这能让学习环境保持整洁，也能避免不同项目之间的库版本冲突。

## 总结

Windows 11 下学习 Python，可以按以下流程开始：

1. 从 Python 官网安装 Python，并勾选 `Add python.exe to PATH`。
2. 安装 PyCharm Community Edition。
3. 新建项目并配置 Python 解释器。
4. 编写并运行 `print("Hello, World!")`。
5. 进入基础语法学习和动手练习阶段。

这样环境搭建完成后，就可以正式开始 Python 学习了。