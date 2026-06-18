import { ComponentProps, ComponentType, CSSProperties, ReactNode } from 'react';
import SpotlightContainerDecorator from '@enact/spotlight/SpotlightContainerDecorator';

interface HiddenWhilePlayingProps {
  hidden: boolean;
  containerId: string;
  children: ReactNode;
}

const ContainerBase = SpotlightContainerDecorator({ enterTo: 'last-focused' }, 'div');
const Container = ContainerBase as ComponentType<
  ComponentProps<typeof ContainerBase> & {
    children?: ReactNode;
    containerId?: string;
    style?: CSSProperties;
  }
>;

const HiddenWhilePlaying = ({ hidden, containerId, children }: HiddenWhilePlayingProps) => (
  <Container
    containerId={containerId}
    spotlightDisabled={hidden}
    style={{
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      visibility: hidden ? 'hidden' : 'visible',
    }}
  >
    {children}
  </Container>
);

export default HiddenWhilePlaying;
