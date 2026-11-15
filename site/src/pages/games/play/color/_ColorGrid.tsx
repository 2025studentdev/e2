// src/pages/games/play/color/_ColorGrid.tsx
type ColorGridProps = {
    rows: string[][];
    active: string;
    onSelect: (hex: string) => void;
};

export function ColorGrid({ rows, active, onSelect }: ColorGridProps) {
    return (
        <div className="cp-grid" aria-label="色板">
            {rows.map((row, rowIndex) => (
                <div className="cp-row" key={`row-${rowIndex}`}>
                    {row.map((hex, colIndex) => {
                        const isActive = hex.toLowerCase() === active.toLowerCase();
                        return (
                            <button
                                key={`${hex}-${rowIndex}-${colIndex}`}
                                type="button"
                                className="cp-swatch"
                                style={{ backgroundColor: hex }}
                                data-active={isActive ? 'true' : 'false'}
                                aria-label={hex.toUpperCase()}
                                aria-pressed={isActive}
                                title={hex.toUpperCase()}
                                onClick={() => onSelect(hex)}
                            />
                        );
                    })}
                </div>
            ))}
        </div>
    );
}