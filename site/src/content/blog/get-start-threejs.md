---
title: Three.js 入门：从 CDN 引用到配合 React，以及在它们之间做选择
pubDate: 2026-10-25T10:00:00
description: Three.js 是 Web 3D 的事实标准，但“怎么引入”和“要不要配 React”是两个常被混在一起的问题。从纯 HTML 的 CDN 引入讲到 R3F 的声明式写法，以及各自的代价——附一个真实项目里 921 kB chunk 的构建日志。
tags:
- Three.js
- React
- WebGL
- 3D
---

Three.js 在 GitHub 上有超过 10 万 Star，周下载量以百万计，是 Web 端 3D 开发绕不开的名字。但第一次接触它的人往往会卡在几个很具体的问题上：它到底是什么？怎么把它放进我的页面？如果我在用 React，应该直接用 Three.js 还是用 React Three Fiber？这篇文章按这个顺序来。

## Three.js 是什么

一句话：**Three.js 是对 WebGL 的封装，让你不用写 GLSL 和底层图形学代码，也能在浏览器里画出 3D 场景**。

WebGL 本身很底层，创建一个三角形就要写一堆缓冲区和着色器。Three.js 把这些封装成直观的对象：场景（`Scene`）、相机（`Camera`）、渲染器（`Renderer`），再加上几何体（`Geometry`）、材质（`Material`）、光源（`Light`）和网格（`Mesh`）。

一个最小的 Three.js 程序永远是同一个骨架：

1. 创建一个**场景**，当作容器。
2. 放一个**相机**，决定从哪里看。
3. 放一个**物体**（Mesh = 几何体 + 材质）。
4. 创建一个**渲染器**，把场景和相机结合，画到页面上。

再复杂的三维应用，也是在这个骨架上不断加东西。

## 纯 HTML + CDN：最快跑起来的方式

如果只是想试试 Three.js，不需要 Node、不需要构建工具。现代推荐做法是 **import map**，而不是老的 `<script src="three.min.js">` 写法。

在 HTML 的 `<head>` 或 `<body>` 里加上：

```html
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/"
  }
}
</script>
<script type="module">
  import * as THREE from 'three';
  import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
</script>
```

`three/addons/` 这个映射是关键。Three.js 的控制器（`OrbitControls`）、加载器（`GLTFLoader`）、后期处理效果并不在核心包 `three` 里，而是在 `examples/jsm/` 目录下，必须单独导入。如果不加 addons 映射，你就只能用到核心几何体，没法加载模型或加轨道控制。

然后就是一个完整的旋转立方体：

```html
<script type="module">
import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 1000
);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x6366f1 })
);
scene.add(cube);

scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);

function animate() {
  requestAnimationFrame(animate);
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
}
animate();
</script>
```

这就是纯 Three.js 的样子：**命令式的**。你手动创建对象、设置属性、加进场景、在 `requestAnimationFrame` 里更新它们。

## 本地安装：npm + 构建工具

实际项目里几乎不会用 CDN 直引，而是：

```bash
npm install three
```

然后和任何现代前端项目一样从 `'three'` 导入：

```js
import * as THREE from 'three';
// 或者按需导入
import { Scene, PerspectiveCamera } from 'three';
```

如果用到控制器或加载器，路径是 `'three/addons/...'`：

```js
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
```

npm 方式的好处是类型提示（配合 `@types/three`）、tree-shaking、以及和打包工具的无缝集成。**不要混用 CDN 和 npm**，同一个库来自不同来源可能导致重复代码或运行时错误。

## 搭配 React：React Three Fiber（R3F）

如果你在写 React，直接把上面的命令式代码塞进 `useEffect` 是可行的，但很快会变得难以维护：手动管理对象的创建、更新和销毁，手动处理 React 状态与 Three.js 动画循环之间的同步。

**React Three Fiber（R3F）** 是 Three.js 的 React 渲染器。它让你用 JSX **声明式地**描述 3D 场景，底层的 `new THREE.Mesh()` 等对象由 R3F 替你创建和更新。

同一个立方体，R3F 写法是这样的：

```jsx
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';

function Box(props) {
  const ref = useRef();
  const [hovered, hover] = useState(false);

  useFrame((state, delta) => {
    ref.current.rotation.x += delta;
  });

  return (
    <mesh
      {...props}
      ref={ref}
      onPointerOver={() => hover(true)}
      onPointerOut={() => hover(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  );
}

function App() {
  return (
    <Canvas>
      <ambientLight intensity={Math.PI / 2} />
      <directionalLight position={[10, 10, 10]} intensity={Math.PI} />
      <Box position={[-1.2, 0, 0]} />
      <Box position={[1.2, 0, 0]} />
    </Canvas>
  );
}
```

安装方式是：

```bash
npm install three @types/three @react-three/fiber
```

R3F 必须和 React 的大版本配对：`@react-three/fiber@8` 对应 React 18，`@react-three/fiber@9` 对应 React 19。

通常还会配一个 **Drei**，它是 R3F 的“工具箱”，提供了大量开箱即用的抽象：轨道控制、环境贴图、加载模型、文字渲染等，能省掉很多重复代码。

## R3F 的优缺点

### 优点

**声明式，和 React 心智模型一致。** 3D 场景变成了一棵组件树，和你的 UI 组件放在同一个体系里管理。状态变化驱动场景变化，不需要手动 `scene.add()` / `scene.remove()`。

**生态完整。** Drei、R3F-Postprocessing、物理库集成（如 Rapier），在 React 项目里接 3D 的摩擦系数最低。

**没有额外运行时开销。** R3F 官方反复强调的一点是：组件在 React 外部渲染，`useFrame` 的回调直接跑在 `requestAnimationFrame` 里，和原生 Three.js 的动画循环没有区别。在大规模场景下，得益于 React 的调度能力，性能甚至可能更好。

### 缺点与代价

**它给项目增加了 React 依赖。** 如果你的页面本身不是 React 应用，仅仅为了用 R3F 而引入 React，是不划算的。这种情况下直接用 Three.js 更干净。

**声明式不是万能的。** R3F 覆盖了 Three.js 的全部能力，但某些高度命令式、每一帧都要精细控制的逻辑，用 R3F 的 hooks 写出来不一定比原生顺手。R3F 的 `useFrame` 本身就是命令式的逃生舱。

**React 的渲染节奏和 Three.js 的动画循环是两套东西。** React 的状态更新是异步的，而 3D 动画是每帧同步执行的。两者混在一起时，如果状态更新过于频繁或依赖链设计不当，可能出现掉帧或状态不一致。这不是 R3F 独有的问题，但需要你有意识地去分离“React 状态”和“每帧动画状态”。

**Bundle 会多一层。** R3F 本身不大（核心约 50 kB 量级），但加上 React、ReactDOM、Drei，对于一个小型 3D 组件来说，总体积会明显超过纯 Three.js 方案。

## 一个真实项目里的警告

这不是纸上谈兵。我的站点是个 Astro 静态博客，其中一个页面集成了若干小游戏，用 Three.js 做 3D 部分，React 组件通过 `@astrojs/react` 作为 island 加载。构建的时候 Vite 直接甩出这个：

```
13:50:12 [WARN] [vite] [plugin builtin:vite-reporter] 
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rolldownOptions.output.codeSplitting to improve chunking
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit
```

500 kB 是 Vite 的默认阈值，超过就报警告。去看看实际产物长什么样：

```powershell
Get-ChildItem -Recurse -File -Filter *.js dist | Sort-Object Length -Descending |
  Select-Object -First 10 @{N='KB';E={[math]::Round($_.Length/1KB,1)}}, FullName
```

输出：

```
   KB FullName
   -- --------
921.7 dist\_astro\_Game.aa35B2k6.js
204.5 dist\_astro\client.CuQ-p2I7.js
 39.7 dist\_astro\client.BE4G5FwC.js
 14.6 dist\_astro\_MbtiTest.KnonKKk4.js
 12.4 dist\_astro\_PhysicsVT.B_nLC-B_.js
 11.3 dist\_astro\_Breakout.BMSql8_T.js
   11 dist\_astro\_SortVisualizer.CWJ0EWo0.js
  8.3 dist\_astro\react.sySUN5R7.js
  5.7 dist\_astro\_Piano.DNjLeHjE.js
  5.4 dist\_astro\GameGrid.BvOUUGdV.js
```

一个 `_Game` chunk 就有 **921.7 kB**，比第二大的 `client`（204 kB）大了四倍多。它的名字说明它是所有游戏页共享的那块代码——Three.js 核心、物理相关的几何计算、几个游戏共用的渲染辅助全被打了进去。

这个例子的价值在于它把“bundle 会多一层”这件事量化了：

- **警告本身不是错误。** 构建照样成功，页面照样生成。它是性能信号，不是失败。
- **需要判断的是“这块代码被谁加载”。** 如果 `_Game` 只被游戏页引用，那它对首页和博客页完全没影响，静态站点也没有首字节压力，921 kB 只在用户点进游戏时下载一次。这种情况可以接受。
- **但如果它被多个非游戏页面共享**，那问题就大了——每个访客都要先下 921 kB 才看到内容。所以我用这条命令确认过引用范围：

```powershell
Get-ChildItem -Recurse -File -Filter *.html dist |
  Select-String -Pattern '_Game\.aa35B2k6' -List | Select-Object Path
```

确认只有游戏页引用它之后，我决定不处理。这不是“忽略警告”，是**基于引用范围做出的判断**。

如果你遇到同类警告，也可以走同样的流程：先看最大的是哪个文件，再看它被哪些页面引用，最后才决定是拆包、动态导入，还是接受它。盲目调高 `chunkSizeWarningLimit` 只会把信号藏起来。

## 怎么选

一个粗糙但有效的判断规则：

- **已经是 React / Next.js 项目**：优先 R3F。3D 场景作为组件树的一部分，可组合、可复用，Drei 能省大量时间。你承担的代价主要是 bundle 变大，以及需要理解 R3F 的 hooks 模型。
- **非 React 项目，或者只有一个孤立的 3D 模块**：直接用 Three.js。没有理由为了一个立方体引入 React 运行时。
- **需要极致的包体积控制，或想完全掌控每一帧**：原生 Three.js 仍然更直接。
- **页面数量多、共享依赖复杂**：无论选哪种，都要预留做代码分割的工夫——上面的 921 kB 就是没做分割时的典型样子。

R3F 不是 Three.js 的“升级版”，它是**同一种能力的另一种表达方式**。选哪种，取决于你的项目已经建立在什么之上，而不是哪种“更先进”。

---

Three.js 的上手门槛比看起来低：一个场景、一个相机、一个渲染器，就能跑起来。真正需要花时间的是理解“命令式”和“声明式”两种写法各自的边界，然后在 CDN 的快速原型、npm 的生产项目、以及 R3F 的组件化场景之间，做出适合当前项目的那一个选择。
