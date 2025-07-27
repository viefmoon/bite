import React, { ReactNode, useMemo, Children } from 'react';
import {
  View,
  ViewStyle,
  StyleProp,
  DimensionValue,
  StyleSheet,
} from 'react-native';
import { useResponsive } from '@/app/hooks/useResponsive';

interface ResponsiveGridProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;

  // Configuración de columnas
  columns?: number;
  columnsTablet?: number;
  columnsLandscape?: number;
  minItemWidth?: number;

  // Configuración de filas
  rows?: number;
  minItemHeight?: number;

  // Espaciado
  gap?: number;
  gapTablet?: number;
  rowGap?: number;
  columnGap?: number;
  padding?: number;

  // Alineación
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justifyContent?:
    | 'flex-start'
    | 'center'
    | 'flex-end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';

  // Comportamiento
  fillLastRow?: boolean;
  equalHeight?: boolean;

  // Estilos de items
  itemStyle?: StyleProp<ViewStyle>;
  itemPadding?: number;
}

interface GridItemProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  span?: number;
  spanTablet?: number;
}

// Componente para items del grid
export const GridItem: React.FC<GridItemProps> = ({
  children,
  style,
  span = 1,
  spanTablet,
}) => {
  const responsive = useResponsive();
  const actualSpan = responsive.isTablet && spanTablet ? spanTablet : span;

  return <View style={[{ flex: actualSpan }, style]}>{children}</View>;
};

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  style,

  // Columnas
  columns = 1,
  columnsTablet,
  columnsLandscape,
  minItemWidth,

  // Filas
  rows,
  minItemHeight,

  // Espaciado
  gap = 16,
  gapTablet,
  rowGap,
  columnGap,
  padding = 0,

  // Alineación
  alignItems = 'stretch',
  justifyContent = 'flex-start',

  // Comportamiento
  fillLastRow = false,
  equalHeight = false,

  // Estilos
  itemStyle,
  itemPadding = 0,
}) => {
  const responsive = useResponsive();

  // Calcular número de columnas
  const calculateColumns = useMemo(() => {
    // Si hay un ancho mínimo definido, calcular columnas dinámicamente
    if (minItemWidth) {
      return responsive.getGridColumns(minItemWidth, gap, padding);
    }

    // Si estamos en landscape y hay columnas específicas para landscape
    if (responsive.isLandscape && columnsLandscape) {
      return columnsLandscape;
    }

    // Si es tablet y hay columnas específicas para tablet
    if (responsive.isTablet && columnsTablet) {
      return columnsTablet;
    }

    // Columnas por defecto
    return columns;
  }, [
    columns,
    columnsTablet,
    columnsLandscape,
    minItemWidth,
    gap,
    padding,
    responsive,
  ]);

  // Calcular gap responsive
  const actualGap =
    responsive.isTablet && gapTablet !== undefined ? gapTablet : gap;
  const scaledGap = responsive.scaleWidth(actualGap);
  const actualRowGap =
    rowGap !== undefined ? responsive.scaleHeight(rowGap) : scaledGap;
  const actualColumnGap =
    columnGap !== undefined ? responsive.scaleWidth(columnGap) : scaledGap;

  // Procesar children en filas
  const processedChildren = useMemo(() => {
    const childArray = Children.toArray(children);
    const gridRows: ReactNode[][] = [];

    // Agrupar children en filas
    for (let i = 0; i < childArray.length; i += calculateColumns) {
      const row = childArray.slice(i, i + calculateColumns);

      // Si fillLastRow está activo y es la última fila incompleta
      if (
        fillLastRow &&
        row.length < calculateColumns &&
        i + calculateColumns >= childArray.length
      ) {
        // Agregar elementos vacíos para completar la fila
        while (row.length < calculateColumns) {
          row.push(
            <View key={`empty-${i}-${row.length}`} style={styles.emptySlot} />,
          );
        }
      }

      gridRows.push(row);
    }

    return gridRows;
  }, [children, calculateColumns, fillLastRow]);

  // Estilos del contenedor
  const containerStyle = useMemo(() => {
    const baseStyle: ViewStyle = {
      padding: responsive.scaleWidth(padding),
    };

    // Si se especifica un número de filas, establecer altura
    if (rows && minItemHeight) {
      baseStyle.height =
        rows * (minItemHeight + actualRowGap) - actualRowGap + padding * 2;
    }

    return [baseStyle, style];
  }, [padding, rows, minItemHeight, actualRowGap, responsive, style]);

  // Estilos de fila
  const rowStyle = useMemo(() => {
    const style: ViewStyle = {
      flexDirection: 'row',
      justifyContent,
      alignItems,
    };

    if (equalHeight) {
      style.alignItems = 'stretch';
    }

    return style;
  }, [justifyContent, alignItems, equalHeight]);

  // Estilos de item
  const gridItemStyle = useMemo(() => {
    const style: ViewStyle = {
      flex: 1,
      padding: responsive.scaleWidth(itemPadding),
    };

    if (minItemHeight) {
      style.minHeight = responsive.scaleHeight(minItemHeight);
    }

    return [style, itemStyle];
  }, [itemPadding, minItemHeight, responsive, itemStyle]);

  return (
    <View style={containerStyle}>
      {processedChildren.map((row, rowIndex) => (
        <View
          key={`row-${rowIndex}`}
          style={[
            rowStyle,
            rowIndex < processedChildren.length - 1 && {
              marginBottom: actualRowGap,
            },
          ]}
        >
          {row.map((child, colIndex) => (
            <View
              key={`item-${rowIndex}-${colIndex}`}
              style={[
                gridItemStyle,
                colIndex < row.length - 1 && { marginRight: actualColumnGap },
              ]}
            >
              {child}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  emptySlot: {
    flex: 1,
  },
});
