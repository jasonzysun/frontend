import config from 'configs/app';

const link = config.UI.views.color.basicLink;
const hover = config.UI.views.color.basicHover;
const semanticTokens = {
  colors: {
    divider: {
      'default': 'blackAlpha.200',
      _dark: 'whiteAlpha.200',
    },
    text: {
      'default': 'blackAlpha.800',
      _dark: 'whiteAlpha.800',
    },
    text_secondary: {
      'default': 'gray.500',
      _dark: 'gray.400',
    },
    link: {
      'default': link[0] || 'blue.600',
      _dark: link[1] || link[0] || 'blue.300',
    },
    link_hovered: {
      'default': hover[0] || 'blue.400',
    },
    error: {
      'default': 'red.400',
      _dark: 'red.300',
    },
  },
  shadows: {
    action_bar: '0 4px 4px -4px rgb(0 0 0 / 10%), 0 2px 4px -4px rgb(0 0 0 / 6%)',
  },
};

export default semanticTokens;
