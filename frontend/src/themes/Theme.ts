import { theme, type ThemeConfig } from 'antd';

import { fontFamily, palette, radius, shadow, shadowDark } from './tokens';

const lightTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: palette.light.primary,
    colorInfo: palette.light.info,
    colorSuccess: palette.light.success,
    colorWarning: palette.light.warning,
    colorError: palette.light.error,
    colorBgLayout: palette.light.appBg,
    colorBgContainer: palette.light.surface,
    colorBgElevated: palette.light.surfaceElevated,
    colorBorder: palette.light.border,
    colorBorderSecondary: palette.light.border,
    colorText: palette.light.text,
    colorTextSecondary: palette.light.textSecondary,
    colorTextTertiary: palette.light.textTertiary,
    colorTextDescription: palette.light.textSecondary,
    colorLink: palette.light.primary,
    colorLinkHover: palette.light.primaryHover,
    fontFamily,
    fontSize: 14,
    borderRadius: radius.md,
    borderRadiusLG: radius.lg,
    borderRadiusSM: radius.sm,
    controlHeight: 38,
    controlHeightLG: 44,
    boxShadow: shadow.md,
    boxShadowSecondary: shadow.sm,
    boxShadowTertiary: shadow.sm,
    wireframe: false,
  },
  components: {
    Layout: {
      headerBg: palette.light.surface,
      bodyBg: palette.light.appBg,
      footerBg: 'transparent',
      siderBg: 'transparent',
      headerHeight: 64,
      headerPadding: '0 24px',
    },
    Menu: {
      itemBg: 'transparent',
      itemColor: palette.light.sidebarText,
      itemHoverBg: palette.light.sidebarHover,
      itemHoverColor: '#FFFFFF',
      itemSelectedBg: palette.light.sidebarSelected,
      itemSelectedColor: '#FFFFFF',
      itemActiveBg: palette.light.sidebarSelected,
      subMenuItemBg: 'transparent',
      itemBorderRadius: radius.md,
      itemMarginInline: 8,
      itemHeight: 40,
      iconSize: 16,
      darkItemBg: 'transparent',
      darkItemColor: palette.light.sidebarText,
      darkItemHoverBg: palette.light.sidebarHover,
      darkItemHoverColor: '#FFFFFF',
      darkItemSelectedBg: palette.light.sidebarSelected,
      darkItemSelectedColor: '#FFFFFF',
      darkSubMenuItemBg: 'transparent',
    },
    Button: {
      borderRadius: radius.md,
      controlHeight: 38,
      controlHeightLG: 44,
      paddingInline: 18,
      fontWeight: 500,
      primaryShadow: 'none',
    },
    Input: {
      borderRadius: radius.md,
      controlHeight: 40,
      paddingInline: 14,
    },
    Card: {
      borderRadiusLG: radius.lg,
      paddingLG: 20,
    },
    Drawer: {
      colorBgElevated: palette.light.surface,
    },
    Popover: {
      borderRadiusLG: radius.lg,
    },
    Modal: {
      borderRadiusLG: radius.lg,
    },
    Avatar: {
      borderRadius: radius.full,
    },
    Tag: {
      borderRadiusSM: radius.sm,
    },
    Tooltip: {
      borderRadius: radius.sm,
    },
    Table: {
      borderRadius: radius.md,
      headerBg: palette.light.surfaceMuted,
      headerColor: palette.light.textSecondary,
      rowHoverBg: palette.light.surfaceMuted,
    },
    List: {
      itemPadding: '12px 16px',
    },
    Select: {
      borderRadius: radius.md,
      controlHeight: 40,
    },
    DatePicker: {
      borderRadius: radius.md,
      controlHeight: 40,
    },
    Notification: {
      borderRadiusLG: radius.lg,
    },
    Divider: {
      colorSplit: palette.light.border,
    },
  },
};

const darkTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: palette.dark.primary,
    colorInfo: palette.dark.info,
    colorSuccess: palette.dark.success,
    colorWarning: palette.dark.warning,
    colorError: palette.dark.error,
    colorBgLayout: palette.dark.appBg,
    colorBgContainer: palette.dark.surface,
    colorBgElevated: palette.dark.surfaceElevated,
    colorBorder: palette.dark.border,
    colorBorderSecondary: palette.dark.border,
    colorText: palette.dark.text,
    colorTextSecondary: palette.dark.textSecondary,
    colorTextTertiary: palette.dark.textTertiary,
    colorTextDescription: palette.dark.textSecondary,
    colorLink: palette.dark.primary,
    colorLinkHover: palette.dark.primaryHover,
    fontFamily,
    fontSize: 14,
    borderRadius: radius.md,
    borderRadiusLG: radius.lg,
    borderRadiusSM: radius.sm,
    controlHeight: 38,
    controlHeightLG: 44,
    boxShadow: shadowDark.md,
    boxShadowSecondary: shadowDark.sm,
    boxShadowTertiary: shadowDark.sm,
    wireframe: false,
  },
  components: {
    Layout: {
      headerBg: palette.dark.surface,
      bodyBg: palette.dark.appBg,
      footerBg: 'transparent',
      siderBg: 'transparent',
      headerHeight: 64,
      headerPadding: '0 24px',
    },
    Menu: {
      itemBg: 'transparent',
      itemColor: palette.dark.sidebarText,
      itemHoverBg: palette.dark.sidebarHover,
      itemHoverColor: '#FFFFFF',
      itemSelectedBg: palette.dark.sidebarSelected,
      itemSelectedColor: '#FFFFFF',
      itemActiveBg: palette.dark.sidebarSelected,
      subMenuItemBg: 'transparent',
      itemBorderRadius: radius.md,
      itemMarginInline: 8,
      itemHeight: 40,
      iconSize: 16,
      darkItemBg: 'transparent',
      darkItemColor: palette.dark.sidebarText,
      darkItemHoverBg: palette.dark.sidebarHover,
      darkItemHoverColor: '#FFFFFF',
      darkItemSelectedBg: palette.dark.sidebarSelected,
      darkItemSelectedColor: '#FFFFFF',
      darkSubMenuItemBg: 'transparent',
    },
    Button: {
      borderRadius: radius.md,
      controlHeight: 38,
      controlHeightLG: 44,
      paddingInline: 18,
      fontWeight: 500,
      primaryShadow: 'none',
    },
    Input: {
      borderRadius: radius.md,
      controlHeight: 40,
      paddingInline: 14,
    },
    Card: {
      borderRadiusLG: radius.lg,
      paddingLG: 20,
    },
    Drawer: {
      colorBgElevated: palette.dark.surface,
    },
    Popover: {
      borderRadiusLG: radius.lg,
    },
    Modal: {
      borderRadiusLG: radius.lg,
    },
    Avatar: {
      borderRadius: radius.full,
    },
    Tag: {
      borderRadiusSM: radius.sm,
    },
    Tooltip: {
      borderRadius: radius.sm,
    },
    Table: {
      borderRadius: radius.md,
      headerBg: palette.dark.surfaceMuted,
      headerColor: palette.dark.textSecondary,
      rowHoverBg: palette.dark.surfaceMuted,
    },
    List: {
      itemPadding: '12px 16px',
    },
    Select: {
      borderRadius: radius.md,
      controlHeight: 40,
    },
    DatePicker: {
      borderRadius: radius.md,
      controlHeight: 40,
    },
    Notification: {
      borderRadiusLG: radius.lg,
    },
    Divider: {
      colorSplit: palette.dark.border,
    },
  },
};

export { lightTheme, darkTheme };
export default lightTheme;
