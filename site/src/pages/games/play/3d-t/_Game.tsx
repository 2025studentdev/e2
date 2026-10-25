import { useGameStore } from './_store';
import { TOWER_DEFS, TOTAL_WAVES } from './_constants';
import Scene from './_Scene';
import './_styles.css';

export default function Game() {
    const {
        money, lives, wave, status, towers, selectedTowerDef, selectedTowerId,
        startGame, resetGame, selectTowerDef, removeTower,
    } = useGameStore();

    const selectedTower = towers.find((t) => t.id === selectedTowerId);
    const selectedDef = selectedTower
        ? TOWER_DEFS.find((d) => d.id === selectedTower.defId)
        : null;

    return (
        <div className="td-root">
            <header className="td-hud">
                <div className="td-hud-left">
                    <span className="td-logo">防御阵列</span>
                    <span className="td-stat">
            波次 <strong>{wave} / {TOTAL_WAVES}</strong>
          </span>
                </div>
                <div className="td-hud-right">
          <span className="td-stat td-money">
            资金 <strong>{money}</strong>
          </span>
                    <span className="td-stat td-lives">
            生命 <strong>{lives}</strong>
          </span>
                </div>
            </header>

            {/* 图例 */}
            <div className="td-legend">
                <span className="td-legend-item"><i style={{ background: '#2a9d8f' }} />起点</span>
                <span className="td-legend-item"><i style={{ background: '#cfc0a0' }} />敌人路径</span>
                <span className="td-legend-item"><i style={{ background: '#e63946' }} />终点</span>
            </div>

            <div className="td-canvas-wrap">
                <Scene />
            </div>

            <footer className="td-tower-bar">
                {TOWER_DEFS.map((def) => (
                    <button
                        key={def.id}
                        className={`td-tower-card ${selectedTowerDef === def.id ? 'td-tower-card--active' : ''}`}
                        onClick={() =>
                            selectTowerDef(selectedTowerDef === def.id ? null : def.id)
                        }
                        disabled={status !== 'playing' || money < def.cost}
                    >
                        <span className="td-tower-swatch" style={{ background: def.color }} />
                        <span className="td-tower-name">{def.name}</span>
                        <span className="td-tower-cost">{def.cost}</span>
                        <span className="td-tower-desc">{def.description}</span>
                    </button>
                ))}
            </footer>

            {selectedTower && selectedDef && (
                <aside className="td-inspector">
                    <h3>{selectedDef.name}</h3>
                    <p className="td-inspector-desc">{selectedDef.description}</p>
                    <div className="td-inspector-row">
                        <span>累计伤害</span>
                        <strong>{Math.round(selectedTower.totalDamage)}</strong>
                    </div>
                    <div className="td-inspector-row">
                        <span>射程</span>
                        <strong>{selectedDef.range}</strong>
                    </div>
                    <button
                        className="td-btn td-btn--danger"
                        onClick={() => removeTower(selectedTower.id)}
                    >
                        拆除（返还 60%）
                    </button>
                </aside>
            )}

            {status !== 'playing' && (
                <div className="td-overlay">
                    <div className="td-overlay-card">
                        {status === 'idle' && (
                            <>
                                <h2>防御阵列</h2>
                                <p>在路径周围部署防御塔，阻止敌人抵达终点。</p>
                                <p>选择下方塔卡片，点击网格即可建造。</p>
                                <button className="td-btn td-btn--primary" onClick={startGame}>
                                    开始部署
                                </button>
                            </>
                        )}
                        {status === 'victory' && (
                            <>
                                <h2>全部波次已清除</h2>
                                <p>你成功守住了阵地。</p>
                                <button className="td-btn td-btn--primary" onClick={resetGame}>
                                    再来一局
                                </button>
                            </>
                        )}
                        {status === 'defeat' && (
                            <>
                                <h2>防线被突破</h2>
                                <p>生命值归零，游戏结束。</p>
                                <button className="td-btn td-btn--primary" onClick={resetGame}>
                                    重新开始
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}