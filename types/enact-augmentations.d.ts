// This file is a module (export {} makes it so) to enable proper module augmentation.
// Ambient declarations here ADD TO existing Enact type definitions rather than replacing them.
export {};

declare module '@enact/sandstone/Panels' {
  interface PanelProps {
    noCloseButton?: boolean;
    onBack?: Function;
  }
}

declare module '@enact/sandstone/Input' {
  // Adding onChange to InputBaseProps overrides HTMLProps.onChange via Merge<>
  interface InputBaseProps {
    onChange?: Function;
    spotlightId?: string;
  }
}

declare module '@enact/sandstone/VirtualList' {
  interface VirtualGridListProps {
    spotlightRestrict?: 'self-first' | 'self-only' | 'none';
    spotlightId?: string;
  }
}

// @enact/ui/Spinner marks `component` as required, but Sandstone's decorator provides a default
declare module '@enact/ui/Spinner' {
  interface SpinnerBaseProps {
    component?: string | React.ComponentType;
  }
}

// VideoPlayerProps in VideoPlayer.d.ts only extends SlottableProps (empty).
// Augment it with the decorated props that VideoPlayerBase defines.
declare module '@enact/sandstone/VideoPlayer' {
  interface VideoPlayerProps {
    title?: string;
    backButtonAriaLabel?: string;
    onBack?: Function;
    noAutoPlay?: boolean;
  }
}
