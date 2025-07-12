/**
 * Utilidades para formatear contenido de tickets térmicos
 */

export class TicketFormatter {
  private readonly paperWidth: number;

  constructor(paperWidthMm: 58 | 80 = 80) {
    this.paperWidth = paperWidthMm;
  }

  /**
   * Obtiene el número de caracteres por línea según el ancho del papel y el tamaño de fuente
   */
  getCharactersPerLine(fontSize: 'normal' | 'compressed' | 'expanded' = 'normal'): number {
    if (this.paperWidth === 80) {
      switch (fontSize) {
        case 'compressed': return 64;
        case 'expanded': return 24;
        default: return 48;
      }
    } else {
      switch (fontSize) {
        case 'compressed': return 42;
        case 'expanded': return 16;
        default: return 32;
      }
    }
  }

  /**
   * Centra el texto añadiendo espacios a los lados
   */
  centerText(text: string, fontSize: 'normal' | 'compressed' | 'expanded' = 'normal'): string {
    const maxChars = this.getCharactersPerLine(fontSize);
    const padding = Math.max(0, Math.floor((maxChars - text.length) / 2));
    return ' '.repeat(padding) + text;
  }

  /**
   * Formatea una línea con texto a la izquierda y derecha
   */
  formatLine(left: string, right: string, fontSize: 'normal' | 'compressed' | 'expanded' = 'normal'): string {
    const maxChars = this.getCharactersPerLine(fontSize);
    const totalLength = left.length + right.length;
    const spaces = Math.max(1, maxChars - totalLength);
    return left + ' '.repeat(spaces) + right;
  }

  /**
   * Formatea una línea de producto con precio, respetando espacio vertical para precios
   * Si el nombre del producto es muy largo, lo corta para dejar espacio al precio
   */
  formatProductLine(productName: string, price: string, fontSize: 'normal' | 'compressed' | 'expanded' = 'normal'): string {
    const maxChars = this.getCharactersPerLine(fontSize);
    const priceSpace = price.length + 2; // Espacio para el precio más margen
    const maxProductLength = maxChars - priceSpace;
    
    // Si el nombre del producto es muy largo, lo cortamos
    if (productName.length > maxProductLength) {
      productName = productName.substring(0, maxProductLength - 3) + '...';
    }
    
    const spaces = maxChars - productName.length - price.length;
    return productName + ' '.repeat(spaces) + price;
  }

  /**
   * Formatea líneas de producto con columnas fijas
   * La columna de precio siempre ocupa un espacio fijo a la derecha
   */
  formatProductLines(productName: string, price: string, fontSize: 'normal' | 'compressed' | 'expanded' = 'normal'): string[] {
    const maxChars = this.getCharactersPerLine(fontSize);
    
    // Reservar espacio fijo para la columna de precios (10 caracteres mínimo)
    const priceColumnWidth = Math.max(10, price.length + 1);
    const productColumnWidth = maxChars - priceColumnWidth - 1; // -1 para separación
    
    // Dividir el nombre del producto en líneas que quepan en la columna de productos
    const productLines = this.wrapTextInColumn(productName, productColumnWidth);
    
    // Formatear cada línea
    const formattedLines: string[] = [];
    for (let i = 0; i < productLines.length; i++) {
      const isLastLine = i === productLines.length - 1;
      const productText = productLines[i];
      
      if (isLastLine) {
        // En la última línea, agregar el precio alineado a la derecha
        const paddedProduct = productText.padEnd(productColumnWidth);
        const paddedPrice = price.padStart(priceColumnWidth);
        formattedLines.push(paddedProduct + ' ' + paddedPrice);
      } else {
        // En las demás líneas, llenar todo el espacio del producto con espacios
        // para mantener la columna de precios libre
        const paddedProduct = productText.padEnd(productColumnWidth);
        const emptyPriceColumn = ' '.repeat(priceColumnWidth + 1);
        formattedLines.push(paddedProduct + emptyPriceColumn);
      }
    }
    
    return formattedLines;
  }

  /**
   * Divide texto en líneas que quepan en un ancho específico de columna
   */
  private wrapTextInColumn(text: string, columnWidth: number): string[] {
    const lines: string[] = [];
    const words = text.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? currentLine + ' ' + word : word;
      
      if (testLine.length <= columnWidth) {
        currentLine = testLine;
      } else {
        // Si la palabra actual no cabe, guardar la línea actual
        if (currentLine) {
          lines.push(currentLine);
        }
        
        // Si una sola palabra es más larga que el ancho de columna, cortarla
        if (word.length > columnWidth) {
          let remainingWord = word;
          while (remainingWord.length > columnWidth) {
            lines.push(remainingWord.substring(0, columnWidth - 1) + '-');
            remainingWord = remainingWord.substring(columnWidth - 1);
          }
          currentLine = remainingWord;
        } else {
          currentLine = word;
        }
      }
    }
    
    // Agregar la última línea si existe
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines.length > 0 ? lines : [''];
  }

  /**
   * Divide texto largo en múltiples líneas
   */
  wrapText(text: string, fontSize: 'normal' | 'compressed' | 'expanded' = 'normal'): string[] {
    const maxChars = this.getCharactersPerLine(fontSize);
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length <= maxChars) {
        currentLine = (currentLine + ' ' + word).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  /**
   * Crea una línea divisoria con caracteres
   */
  createDivider(char: string = '-', fontSize: 'normal' | 'compressed' | 'expanded' = 'normal'): string {
    const maxChars = this.getCharactersPerLine(fontSize);
    return char.repeat(maxChars);
  }

  /**
   * Formatea una tabla simple
   */
  formatTable(rows: Array<{ col1: string; col2: string; col3?: string }>, fontSize: 'normal' | 'compressed' | 'expanded' = 'normal'): string[] {
    const maxChars = this.getCharactersPerLine(fontSize);
    const lines: string[] = [];

    if (rows[0]?.col3 !== undefined) {
      // Tabla de 3 columnas
      const col1Width = Math.floor(maxChars * 0.5);
      const col2Width = Math.floor(maxChars * 0.25);
      const col3Width = maxChars - col1Width - col2Width;

      for (const row of rows) {
        const col1 = row.col1.substring(0, col1Width).padEnd(col1Width);
        const col2 = row.col2.substring(0, col2Width).padEnd(col2Width);
        const col3 = (row.col3 || '').substring(0, col3Width).padStart(col3Width);
        lines.push(col1 + col2 + col3);
      }
    } else {
      // Tabla de 2 columnas
      const col1Width = Math.floor(maxChars * 0.7);
      const col2Width = maxChars - col1Width;

      for (const row of rows) {
        const col1 = row.col1.substring(0, col1Width).padEnd(col1Width);
        const col2 = row.col2.substring(0, col2Width).padStart(col2Width);
        lines.push(col1 + col2);
      }
    }

    return lines;
  }

  /**
   * Formatea montos monetarios con alineación
   */
  formatMoney(amount: number): string {
    // Si el monto no tiene decimales significativos, mostrar sin decimales
    if (amount % 1 === 0) {
      return `$${amount.toFixed(0)}`;
    }
    // Si tiene decimales, mostrarlos
    return `$${amount.toFixed(2)}`;
  }

  /**
   * Formatea una línea de producto estilo tabla con columnas estrictas
   * Garantiza que el precio SIEMPRE esté en su columna sin invasión de texto
   * @param dynamicPriceWidth - Ancho opcional calculado dinámicamente para la columna de precios
   */
  formatProductTable(productName: string, price: string, fontSize: 'normal' | 'compressed' | 'expanded' = 'normal', dynamicPriceWidth?: number): string[] {
    const maxChars = this.getCharactersPerLine(fontSize);
    
    // Definir anchos de columna fijos con separador
    // Reservamos más espacio para precios para asegurar separación clara
    let productColumnWidth: number;
    let priceColumnWidth: number;
    let separatorWidth = 1; // Espacio entre columnas
    
    // Si se proporciona un ancho dinámico, usarlo
    if (dynamicPriceWidth && dynamicPriceWidth > 0) {
      priceColumnWidth = dynamicPriceWidth;
      productColumnWidth = maxChars - priceColumnWidth - separatorWidth;
    } else {
      // Usar valores predeterminados según el tamaño de fuente
      if (fontSize === 'expanded') {
        // Con fuente expandida, tenemos menos caracteres disponibles
        if (this.paperWidth === 80) {
          priceColumnWidth = 7; // Suficiente para "$9999" o "$999.99"
          productColumnWidth = maxChars - priceColumnWidth - separatorWidth;
        } else {
          priceColumnWidth = 6; // Suficiente para "$999" o "$99.99"
          productColumnWidth = maxChars - priceColumnWidth - separatorWidth;
        }
      } else {
        // Fuente normal
        if (this.paperWidth === 80) {
          priceColumnWidth = 8; // Más espacio para precios con fuente normal
          productColumnWidth = maxChars - priceColumnWidth - separatorWidth;
        } else {
          priceColumnWidth = 7;
          productColumnWidth = maxChars - priceColumnWidth - separatorWidth;
        }
      }
    }
    
    // Dividir el texto del producto en líneas que respeten el ancho de columna
    const lines: string[] = [];
    let remainingText = productName;
    
    while (remainingText.length > 0) {
      if (remainingText.length <= productColumnWidth) {
        // Última línea - agregar el precio
        const productPart = remainingText.padEnd(productColumnWidth);
        const separator = ' '.repeat(separatorWidth);
        const pricePart = price.padStart(priceColumnWidth);
        lines.push(productPart + separator + pricePart);
        break;
      } else {
        // Buscar el mejor punto de corte (espacio)
        let cutPoint = productColumnWidth;
        for (let i = productColumnWidth; i > 0; i--) {
          if (remainingText[i] === ' ') {
            cutPoint = i;
            break;
          }
        }
        
        // Si no hay espacios, cortar en el límite de columna
        if (cutPoint === productColumnWidth && remainingText[cutPoint] !== ' ') {
          // Buscar si hay un espacio cercano hacia adelante
          for (let i = productColumnWidth; i < remainingText.length && i < productColumnWidth + 5; i++) {
            if (remainingText[i] === ' ') {
              cutPoint = i;
              break;
            }
          }
          
          // Si aún no hay espacio, cortar con guión
          if (cutPoint === productColumnWidth) {
            cutPoint = productColumnWidth - 1;
            const productPart = remainingText.substring(0, cutPoint) + '-';
            const paddedProduct = productPart.padEnd(productColumnWidth);
            lines.push(paddedProduct + ' '.repeat(separatorWidth + priceColumnWidth));
            remainingText = remainingText.substring(cutPoint);
            continue;
          }
        }
        
        // Extraer la línea y continuar
        const productPart = remainingText.substring(0, cutPoint).trim();
        const paddedProduct = productPart.padEnd(productColumnWidth);
        lines.push(paddedProduct + ' '.repeat(separatorWidth + priceColumnWidth));
        remainingText = remainingText.substring(cutPoint).trim();
      }
    }
    
    // Si no se generaron líneas (caso edge), agregar una línea con el precio
    if (lines.length === 0) {
      const productPart = ''.padEnd(productColumnWidth);
      const separator = ' '.repeat(separatorWidth);
      const pricePart = price.padStart(priceColumnWidth);
      lines.push(productPart + separator + pricePart);
    }
    
    return lines;
  }

  /**
   * Crea un recuadro alrededor del texto
   */
  createBox(text: string, fontSize: 'normal' | 'compressed' | 'expanded' = 'normal'): string[] {
    const maxChars = this.getCharactersPerLine(fontSize);
    const lines: string[] = [];
    
    // Línea superior
    lines.push('┌' + '─'.repeat(maxChars - 2) + '┐');
    
    // Contenido
    const wrappedText = this.wrapText(text, fontSize);
    for (const line of wrappedText) {
      const padding = maxChars - line.length - 2;
      lines.push('│' + line + ' '.repeat(padding) + '│');
    }
    
    // Línea inferior
    lines.push('└' + '─'.repeat(maxChars - 2) + '┘');
    
    return lines;
  }
}