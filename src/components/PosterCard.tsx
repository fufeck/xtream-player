import { useState, useCallback } from 'react';
import Spottable from '@enact/spotlight/Spottable';
import Icon from '@enact/sandstone/Icon';
import ri from '@enact/ui/resolution';

interface PosterCardBaseProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  name: string;
  'data-index'?: number;
}

const PosterCardBase = ({
  style,
  src,
  name,
  onClick,
  'data-index': dataIndex,
  onFocus,
  onBlur,
  ...rest
}: PosterCardBaseProps) => {
  const [focused, setFocused] = useState(false);

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      setFocused(true);
      if (onFocus) onFocus(e);
    },
    [onFocus],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      setFocused(false);
      if (onBlur) onBlur(e);
    },
    [onBlur],
  );

  return (
    <div
      {...rest}
      style={{ ...style }}
      onClick={onClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
      data-index={dataIndex}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            borderRadius: 4,
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: '#1a1a1a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={"huge" as "large"} style={{ opacity: 0.4 }}>
            playcircle
          </Icon>
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: focused ? 'rgba(230,182,85,0.95)' : 'rgba(0,0,0,0.85)',
          color: focused ? '#000' : '#fff',
          padding: `${ri.scale(6)}px ${ri.scale(8)}px`,
          fontSize: `${ri.scale(20)}px`,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          zIndex: 1,
          transition: 'background 0.15s, color 0.15s',
          borderBottomRightRadius: 4,
          borderBottomLeftRadius: 4,
          textAlign: 'center',
        }}
      >
        {name}
      </div>
      {focused && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            border: `${ri.scale(4)}px solid #e6b655`,
            borderRadius: 4,
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />
      )}
    </div>
  );
};

const PosterCard = Spottable(PosterCardBase);

export default PosterCard;
