import React, { useState, useEffect, useCallback, useMemo } from 'react';

// 物理量接口
interface PhysicsInput {
  v0: string;
  v: string;
  a: string;
  t: string;
  x: string;
}

interface PhysicsResult {
  v0: number | null;
  v: number | null;
  a: number | null;
  t: number | null;
  x: number | null;
  valid: boolean;
  message: string;
  formulaUsed: string[];
}

// 核心计算函数
function calculatePhysics(input: PhysicsInput): PhysicsResult {
  const result: PhysicsResult = {
    v0: null,
    v: null,
    a: null,
    t: null,
    x: null,
    valid: false,
    message: '',
    formulaUsed: []
  };

  const v0 = parseFloat(input.v0);
  const v = parseFloat(input.v);
  const a = parseFloat(input.a);
  const t = parseFloat(input.t);
  const x = parseFloat(input.x);

  const hasV0 = !isNaN(v0);
  const hasV = !isNaN(v);
  const hasA = !isNaN(a);
  const hasT = !isNaN(t);
  const hasX = !isNaN(x);

  const inputCount = [hasV0, hasV, hasA, hasT, hasX].filter(Boolean).length;

  if (inputCount === 0) {
    result.message = '请输入至少两个物理量';
    return result;
  }

  if (inputCount === 1) {
    result.message = '仅输入一个物理量无法求解，请至少输入两个';
    return result;
  }

  try {
    // 情况1: 已知 v0, a, t → 求 v, x
    if (hasV0 && hasA && hasT) {
      result.v0 = v0;
      result.a = a;
      result.t = t;
      result.v = v0 + a * t;
      result.x = v0 * t + 0.5 * a * t * t;
      result.formulaUsed = ['v = v₀ + at', 'x = v₀t + ½at²'];
    }
    // 情况2: 已知 v0, v, t → 求 a, x
    else if (hasV0 && hasV && hasT) {
      result.v0 = v0;
      result.v = v;
      result.t = t;
      result.a = (v - v0) / t;
      result.x = (v0 + v) * t / 2;
      result.formulaUsed = ['a = (v - v₀)/t', 'x = (v₀ + v)t/2'];
    }
    // 情况3: 已知 v0, v, a → 求 t, x
    else if (hasV0 && hasV && hasA) {
      result.v0 = v0;
      result.v = v;
      result.a = a;
      if (a === 0) {
        if (v0 !== v) {
          result.message = '加速度为0时，初速度必须等于末速度';
          return result;
        }
        result.message = '匀速直线运动：a = 0，无法确定时间和位移';
        result.valid = true;
        return result;
      }
      result.t = (v - v0) / a;
      result.x = (v * v - v0 * v0) / (2 * a);
      result.formulaUsed = ['t = (v - v₀)/a', 'v² - v₀² = 2ax'];
    }
    // 情况4: 已知 v0, x, t → 求 a, v
    else if (hasV0 && hasX && hasT) {
      result.v0 = v0;
      result.x = x;
      result.t = t;
      result.a = 2 * (x - v0 * t) / (t * t);
      result.v = v0 + result.a * t;
      result.formulaUsed = ['x = v₀t + ½at²（反解）', 'v = v₀ + at'];
    }
    // 情况5: 已知 v, a, t → 求 v0, x
    else if (hasV && hasA && hasT) {
      result.v = v;
      result.a = a;
      result.t = t;
      result.v0 = v - a * t;
      result.x = result.v0 * t + 0.5 * a * t * t;
      result.formulaUsed = ['v₀ = v - at', 'x = v₀t + ½at²'];
    }
    // 情况6: 已知 v, x, t → 求 v0, a
    else if (hasV && hasX && hasT) {
      result.v = v;
      result.x = x;
      result.t = t;
      result.v0 = 2 * x / t - v;
      result.a = (v - result.v0) / t;
      result.formulaUsed = ['x = (v₀ + v)t/2（反解）', 'a = (v - v₀)/t'];
    }
    // 情况7: 已知 a, x, t → 求 v0, v
    else if (hasA && hasX && hasT) {
      result.a = a;
      result.x = x;
      result.t = t;
      result.v0 = (x - 0.5 * a * t * t) / t;
      result.v = result.v0 + a * t;
      result.formulaUsed = ['x = v₀t + ½at²（反解）', 'v = v₀ + at'];
    }
    // 情况8: 已知 v0, v, x → 求 a, t
    else if (hasV0 && hasV && hasX) {
      result.v0 = v0;
      result.v = v;
      result.x = x;
      if (v0 === v) {
        if (x !== 0) {
          result.message = '速度不变但有位移，输入矛盾';
          return result;
        }
        result.message = '物体静止：v₀ = v = 0, x = 0';
        result.valid = true;
        return result;
      }
      result.a = (v * v - v0 * v0) / (2 * x);
      result.t = (v - v0) / result.a;
      result.formulaUsed = ['v² - v₀² = 2ax', 't = (v - v₀)/a'];
    }
    // 情况9: 已知 v0, a, x → 求 v, t
    else if (hasV0 && hasA && hasX) {
      result.v0 = v0;
      result.a = a;
      result.x = x;
      const discriminant = v0 * v0 + 2 * a * x;
      if (discriminant < 0) {
        result.message = '无实数解：v₀² + 2ax < 0';
        return result;
      }
      result.v = Math.sqrt(discriminant);
      result.t = (result.v - v0) / a;
      result.formulaUsed = ['v² = v₀² + 2ax', 't = (v - v₀)/a'];
    }
    // 情况10: 已知 v, a, x → 求 v0, t
    else if (hasV && hasA && hasX) {
      result.v = v;
      result.a = a;
      result.x = x;
      const discriminant = v * v - 2 * a * x;
      if (discriminant < 0) {
        result.message = '无实数解：v² - 2ax < 0';
        return result;
      }
      result.v0 = Math.sqrt(discriminant);
      result.t = (v - result.v0) / a;
      result.formulaUsed = ['v₀² = v² - 2ax', 't = (v - v₀)/a'];
    }
    else {
      result.message = '当前组合无法唯一确定所有物理量';
      return result;
    }

    // 验证结果的合理性
    if (result.t !== null && result.t < 0) {
      result.message = '警告：计算得到负时间，请检查输入';
    } else {
      result.message = '计算成功';
    }

    result.valid = true;
    return result;
  } catch (e) {
    result.message = '计算错误，请检查输入';
    return result;
  }
}

// 格式化数字
function formatNumber(num: number | null, precision: number = 4): string {
  if (num === null || isNaN(num)) return '--';
  const rounded = Math.round(num * Math.pow(10, precision)) / Math.pow(10, precision);
  return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(precision).replace(/\.?0+$/, '');
}

const unitMap: Record<string, string> = {
  v0: 'm/s',
  v: 'm/s',
  a: 'm/s²',
  t: 's',
  x: 'm'
};

const nameMap: Record<string, string> = {
  v0: '初速度',
  v: '末速度',
  a: '加速度',
  t: '时间',
  x: '位移'
};

const symbolMap: Record<string, string> = {
  v0: 'v₀',
  v: 'v',
  a: 'a',
  t: 't',
  x: 'x'
};

export default function PhysicsVT() {
  const [input, setInput] = useState<PhysicsInput>({
    v0: '',
    v: '',
    a: '',
    t: '',
    x: ''
  });

  const [result, setResult] = useState<PhysicsResult | null>(null);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [showFormulas, setShowFormulas] = useState(false);
  const [showRatios, setShowRatios] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // 处理输入变化
  const handleInputChange = useCallback((field: keyof PhysicsInput, value: string) => {
    if (value !== '' && !/^-?\d*\.?\d*$/.test(value)) return;
    setInput(prev => ({ ...prev, [field]: value }));
  }, []);

  // 自动计算
  useEffect(() => {
    const res = calculatePhysics(input);
    setResult(res);
  }, [input]);

  // 清空
  const handleClear = useCallback(() => {
    setInput({ v0: '', v: '', a: '', t: '', x: '' });
    setResult(null);
  }, []);

  // 复制结果
  const handleCopy = useCallback((field: string, value: string) => {
    navigator.clipboard?.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  }, []);

  // 示例数据
  const examples = [
    { name: '自由落体', data: { v0: '0', v: '', a: '9.8', t: '3', x: '' } },
    { name: '汽车加速', data: { v0: '10', v: '30', a: '', t: '5', x: '' } },
    { name: '刹车减速', data: { v0: '20', v: '0', a: '-4', t: '', x: '' } },
    { name: '竖直上抛', data: { v0: '15', v: '', a: '-9.8', t: '2', x: '' } }
  ];

  const handleExample = useCallback((data: PhysicsInput) => {
    setInput(data);
  }, []);

  // 输入数量
  const inputCount = Object.values(input).filter(v => v !== '').length;

  // 计算中间时刻速度和中间位置速度
  const midTimeVelocity = useMemo(() => {
    if (result?.valid && result.v0 !== null && result.v !== null) {
      return (result.v0 + result.v) / 2;
    }
    return null;
  }, [result]);

  const midPositionVelocity = useMemo(() => {
    if (result?.valid && result.v0 !== null && result.v !== null) {
      return Math.sqrt((result.v0 * result.v0 + result.v * result.v) / 2);
    }
    return null;
  }, [result]);

  return (
    <div className="physics-container">
      {/* 头部 */}
      <header className="physics-header">
        <div className="header-badge">高一物理</div>
        <h1>匀变速直线运动计算器</h1>
        <p className="subtitle">Uniform Variable Rectilinear Motion Calculator</p>
        <div className="header-line"></div>
      </header>

      {/* 主内容 */}
      <main className="physics-main">
        {/* 左侧输入区 */}
        <section className="input-section">
          <div className="section-title">
            <span className="icon">⚙</span>
            <h2>已知量输入</h2>
            <span className={`badge ${inputCount >= 2 ? 'success' : ''}`}>{inputCount}/5</span>
          </div>

          <p className="hint">输入任意 2-3 个物理量，自动求解其余未知量</p>

          <div className="input-grid">
            {(['v0', 'v', 'a', 't', 'x'] as const).map((field) => (
              <div
                key={field}
                className={`input-group ${activeField === field ? 'active' : ''} ${input[field] !== '' ? 'filled' : ''}`}
              >
                <label htmlFor={field}>
                  <span className="label-symbol">{symbolMap[field]}</span>
                  <span className="label-name">{nameMap[field]}</span>
                  <span className="label-unit">{unitMap[field]}</span>
                </label>
                <div className="input-wrapper">
                  <input
                    id={field}
                    type="text"
                    inputMode="decimal"
                    value={input[field]}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    onFocus={() => setActiveField(field)}
                    onBlur={() => setActiveField(null)}
                    placeholder="--"
                  />
                  {input[field] !== '' && (
                    <button
                      className="clear-btn"
                      onClick={() => handleInputChange(field, '')}
                      title="清空"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 操作按钮 */}
          <div className="action-buttons">
            <button className="btn btn-clear" onClick={handleClear}>
              清空全部
            </button>
            <div className="example-buttons">
              <span className="example-label">示例:</span>
              {examples.map((ex, i) => (
                <button
                  key={i}
                  className="btn btn-example"
                  onClick={() => handleExample(ex.data)}
                  title={ex.name}
                >
                  {ex.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 右侧结果区 */}
        <section className="result-section">
          <div className="section-title">
            <span className="icon">∑</span>
            <h2>计算结果</h2>
            {result?.valid && <span className="badge success">已求解</span>}
          </div>

          {result && (
            <>
              {/* 状态提示 */}
              <div className={`status-message ${result.valid ? 'success' : 'warning'}`}>
                <span className="status-icon">{result.valid ? '✓' : '!'}</span>
                {result.message}
              </div>

              {/* 结果卡片 */}
              <div className="result-grid">
                {(['v0', 'v', 'a', 't', 'x'] as const).map((field) => {
                  const value = result[field as keyof PhysicsResult] as number | null;
                  const isCalculated = value !== null && input[field] === '';
                  const isInput = input[field] !== '';
                  const displayValue = formatNumber(value);

                  return (
                    <div
                      key={field}
                      className={`result-card ${isCalculated ? 'calculated' : ''} ${isInput ? 'input-value' : ''} ${value === null ? 'empty' : ''}`}
                    >
                      <div className="result-header">
                        <div className="result-title">
                          <span className="result-symbol">{symbolMap[field]}</span>
                          <span className="result-name">{nameMap[field]}</span>
                        </div>
                        {isCalculated && <span className="calc-badge">计算</span>}
                        {isInput && <span className="input-badge">输入</span>}
                      </div>
                      <div className="result-body">
                        <div className="result-value">
                          {displayValue}
                          <span className="result-unit">{unitMap[field]}</span>
                        </div>
                        {value !== null && (
                          <button
                            className="copy-btn"
                            onClick={() => handleCopy(field, displayValue)}
                            title="复制数值"
                          >
                            {copiedField === field ? '✓' : '⧉'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 使用的公式 */}
              {result.valid && result.formulaUsed.length > 0 && (
                <div className="formulas-used">
                  <h3>使用公式</h3>
                  <div className="formula-tags">
                    {result.formulaUsed.map((formula, i) => (
                      <span key={i} className="formula-tag">{formula}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* 运动分析 */}
              {result.valid && result.a !== null && (
                <div className="analysis-section">
                  <h3>运动分析</h3>
                  <div className="analysis-grid">
                    <div className="analysis-card">
                      <span className="analysis-label">运动类型</span>
                      <span className={`analysis-value ${result.a > 0 ? 'accelerating' : result.a < 0 ? 'decelerating' : 'constant'}`}>
                        {result.a > 0 ? '匀加速' : result.a < 0 ? '匀减速' : '匀速'}
                      </span>
                    </div>
                    {midTimeVelocity !== null && (
                      <div className="analysis-card">
                        <span className="analysis-label">中间时刻速度</span>
                        <span className="analysis-value">{formatNumber(midTimeVelocity)} m/s</span>
                      </div>
                    )}
                    {midPositionVelocity !== null && (
                      <div className="analysis-card">
                        <span className="analysis-label">中间位置速度</span>
                        <span className="analysis-value">{formatNumber(midPositionVelocity)} m/s</span>
                      </div>
                    )}
                    {result.t !== null && result.t > 0 && result.a !== null && (
                      <div className="analysis-card">
                        <span className="analysis-label">平均速度</span>
                        <span className="analysis-value">
                          {result.x !== null ? formatNumber(result.x / result.t) : '--'} m/s
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 比例关系 */}
              {result.valid && result.v0 === 0 && result.a !== null && result.a > 0 && (
                <div className="ratio-section">
                  <div className="ratio-header" onClick={() => setShowRatios(!showRatios)}>
                    <h3>初速度为零的比例关系</h3>
                    <span className={`arrow ${showRatios ? 'up' : 'down'}`}>▼</span>
                  </div>
                  {showRatios && (
                    <div className="ratio-content">
                      <div className="ratio-group">
                        <h4>等时间间隔（T, 2T, 3T...nT）</h4>
                        <div className="ratio-table">
                          <div className="ratio-row header">
                            <span>物理量</span>
                            <span>比例关系</span>
                          </div>
                          <div className="ratio-row">
                            <span>瞬时速度</span>
                            <span className="ratio-formula">1 : 2 : 3 : ... : n</span>
                          </div>
                          <div className="ratio-row">
                            <span>总位移</span>
                            <span className="ratio-formula">1 : 4 : 9 : ... : n²</span>
                          </div>
                        </div>
                      </div>
                      <div className="ratio-group">
                        <h4>连续相等时间间隔（第1T内、第2T内...）</h4>
                        <div className="ratio-table">
                          <div className="ratio-row">
                            <span>位移之比</span>
                            <span className="ratio-formula">1 : 3 : 5 : ... : (2n-1)</span>
                          </div>
                        </div>
                      </div>
                      <div className="ratio-group">
                        <h4>等位移间隔（通过x, 2x, 3x...nx）</h4>
                        <div className="ratio-table">
                          <div className="ratio-row">
                            <span>时间之比</span>
                            <span className="ratio-formula">1 : (√2-1) : (√3-√2) : ...</span>
                          </div>
                          <div className="ratio-row">
                            <span>末速度之比</span>
                            <span className="ratio-formula">1 : √2 : √3 : ... : √n</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* 公式参考 */}
          <div className="formula-section">
            <div className="formula-header" onClick={() => setShowFormulas(!showFormulas)}>
              <h3>公式速查</h3>
              <span className={`arrow ${showFormulas ? 'up' : 'down'}`}>▼</span>
            </div>
            {showFormulas && (
              <div className="formula-content">
                <div className="formula-group">
                  <h4>基本公式</h4>
                  <div className="formula-list">
                    <div className="formula-item">
                      <span className="formula-tag">速度公式</span>
                      <code className="formula-code">v = v₀ + at</code>
                    </div>
                    <div className="formula-item">
                      <span className="formula-tag">位移公式</span>
                      <code className="formula-code">x = v₀t + ½at²</code>
                    </div>
                    <div className="formula-item">
                      <span className="formula-tag">速度位移</span>
                      <code className="formula-code">v² - v₀² = 2ax</code>
                    </div>
                    <div className="formula-item">
                      <span className="formula-tag">平均速度</span>
                      <code className="formula-code">v̄ = (v₀ + v)/2 = x/t</code>
                    </div>
                  </div>
                </div>
                <div className="formula-group">
                  <h4>重要推论</h4>
                  <div className="formula-list">
                    <div className="formula-item">
                      <span className="formula-tag">中间时刻</span>
                      <code className="formula-code">v(t/2) = v̄ = (v₀ + v)/2</code>
                    </div>
                    <div className="formula-item">
                      <span className="formula-tag">中间位置</span>
                      <code className="formula-code">v(x/2) = √[(v₀² + v²)/2]</code>
                    </div>
                    <div className="formula-item">
                      <span className="formula-tag">逐差公式</span>
                      <code className="formula-code">Δx = aT²</code>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* 页脚 */}
      <footer className="physics-footer">
        <p>基于高一物理必修一 · 匀变速直线运动公式</p>
      </footer>
    </div>
  );
}
