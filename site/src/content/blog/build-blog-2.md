---
title: Markdown 渲染测试
pubDate: 2026-09-27T11:30:00
description: 一份用来检查排版和 KaTeX 公式渲染的测试文。
tags:
  - 测试
  - Markdown
---

# 一级标题

## 二级标题

### 三级标题

#### 四级标题

普通段落。中文排版检查：引号"这样"、省略号……、破折号——都应该正常显示。**加粗**、*斜体*、***加粗斜体***、~~删除线~~、`行内代码`。

## 列表

无序列表：

- 第一项
- 第二项
  - 嵌套项 A
  - 嵌套项 B
- 第三项

有序列表：

1. 第一步
2. 第二步
3. 第三步

## 引用

> 这是一段引用。
> 引用可以有多行。
>
> 也可以有空行分段。

## 链接与图片

[Astro 官网](https://astro.build)

![占位图](https://placehold.co/800x400)

## 表格

| 语法 | 说明 | 示例 |
| --- | --- | --- |
| 加粗 | 强调 | **text** |
| 斜体 | 弱强调 | *text* |
| 代码 | 行内 | `code` |

## 代码块

```ts
export function greet(name: string): string {
  return `Hello, ${name}!`;
}

console.log(greet('world'));



```

## 分隔线

---

## KaTeX 行内公式

质能方程 $E = mc^2$ 是最著名的公式之一。

欧拉恒等式 $e^{i\pi} + 1 = 0$ 把五个基本常数联系起来。

## KaTeX 块级公式

二次方程求根公式：

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

高斯积分：

$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}
$$

求和与极限：

$$
\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}
$$

矩阵：

$$
\mathbf{A} =
\begin{pmatrix}
a_{11} & a_{12} \\
a_{21} & a_{22}
\end{pmatrix}
$$

麦克斯韦方程组（微分形式）：

$$
\begin{aligned}
\nabla \cdot \mathbf{E} &= \frac{\rho}{\varepsilon_0} \\
\nabla \cdot \mathbf{B} &= 0 \\
\nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} \\
\nabla \times \mathbf{B} &= \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}
\end{aligned}
$$

## 收尾

如果上面所有元素都渲染正常，这篇测试文就通过了。