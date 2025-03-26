// 当插件启动时显示UI
figma.showUI(__html__, { width: 320, height: 600 });

// 将RGBA颜色转换为十六进制格式（包含透明度）
function rgbaToHex(r, g, b, a = 1) {
  console.log("rgbaToHex 接收到参数:", {
    r: r,
    g: g,
    b: b,
    a: a,
    rType: typeof r,
    gType: typeof g,
    bType: typeof b,
    aType: typeof a,
  });

  // 检查输入是否有效数字
  if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) {
    console.error("rgbaToHex接收到无效数值:", {
      r: `${r} (${isNaN(r) ? "NaN" : "有效"})`,
      g: `${g} (${isNaN(g) ? "NaN" : "有效"})`,
      b: `${b} (${isNaN(b) ? "NaN" : "有效"})`,
      a: `${a} (${isNaN(a) ? "NaN" : "有效"})`,
    });
    return "#000000FF"; // 返回黑色作为默认颜色
  }

  // 确保RGB值在0-255范围内
  const r255 = r * 255;
  const g255 = g * 255;
  const b255 = b * 255;

  console.log("乘以255后的值:", {
    r255: r255,
    g255: g255,
    b255: b255,
  });

  r = Math.min(255, Math.max(0, Math.round(r255)));
  g = Math.min(255, Math.max(0, Math.round(g255)));
  b = Math.min(255, Math.max(0, Math.round(b255)));

  console.log("四舍五入并限制范围后:", {
    r: r,
    g: g,
    b: b,
  });

  // 将透明度（0-1）转换为（0-255）
  const alpha = Math.min(255, Math.max(0, Math.round(a * 255)));
  console.log("处理后的alpha值:", alpha);

  // 转换为十六进制并确保每个值都是两位数
  const rHex = r.toString(16).padStart(2, "0");
  const gHex = g.toString(16).padStart(2, "0");
  const bHex = b.toString(16).padStart(2, "0");
  const aHex = alpha.toString(16).padStart(2, "0");

  console.log("十六进制转换结果:", {
    rHex: rHex,
    gHex: gHex,
    bHex: bHex,
    aHex: aHex,
  });

  // 返回格式化的十六进制颜色值（包含透明度）
  const result = `#${rHex}${gHex}${bHex}${aHex}`.toUpperCase();
  console.log("最终颜色值:", result);
  return result;
}

// 统一处理颜色对象的函数
function processColor(colorObj) {
  // 默认黑色（带透明度）
  const DEFAULT_COLOR = "#000000FF";

  console.log("processColor 接收到颜色对象:", JSON.stringify(colorObj));

  // 检查颜色对象是否存在
  if (!colorObj || typeof colorObj !== "object") {
    console.error("颜色对象无效 - 非对象或为空:", colorObj);
    return DEFAULT_COLOR;
  }

  // 打印颜色对象的所有属性及其类型
  console.log("颜色对象属性:");
  for (const key in colorObj) {
    console.log(`- ${key}: ${colorObj[key]} (类型: ${typeof colorObj[key]})`);
  }

  // 检查RGB值是否都是有效数字
  const rValid = typeof colorObj.r === "number" && !isNaN(colorObj.r);
  const gValid = typeof colorObj.g === "number" && !isNaN(colorObj.g);
  const bValid = typeof colorObj.b === "number" && !isNaN(colorObj.b);

  console.log("RGB属性检查:", {
    r: { value: colorObj.r, valid: rValid },
    g: { value: colorObj.g, valid: gValid },
    b: { value: colorObj.b, valid: bValid },
  });

  if (!rValid || !gValid || !bValid) {
    console.error("颜色缺少有效的RGB值:", {
      r: colorObj.r,
      g: colorObj.g,
      b: colorObj.b,
    });
    return DEFAULT_COLOR;
  }

  // 获取透明度，默认为1
  const alpha =
    typeof colorObj.a === "number" && !isNaN(colorObj.a) ? colorObj.a : 1;
  console.log("透明度值:", alpha);

  // 执行转换前的RGB值
  console.log("原始RGB值:", {
    r: colorObj.r,
    g: colorObj.g,
    b: colorObj.b,
  });

  // 使用rgbaToHex转换为十六进制
  const hexColor = rgbaToHex(colorObj.r, colorObj.g, colorObj.b, alpha);
  console.log("转换后的十六进制颜色:", hexColor);

  return hexColor;
}

// 辅助函数：过滤渐变相关属性
function filterGradientProperties(nodeInfo) {
  // 创建一个新对象，避免直接修改原对象
  const filtered = Object.assign({}, nodeInfo);

  // 处理fills
  if (filtered.fills) {
    filtered.fills = filtered.fills
      .filter((fill) => fill.type === "SOLID")
      .map((fill) => {
        const processed = Object.assign({}, fill);
        delete processed.gradientTransform;
        delete processed.gradientStops;
        if (fill.type === "SOLID" && fill.color) {
          // 检查color是否已经是字符串（已处理过的十六进制颜色）
          if (typeof fill.color === "string") {
            processed.color = fill.color;
          } else {
            processed.color = processColor(fill.color);
          }
        }
        return processed;
      });
  }

  // 处理strokes
  if (filtered.strokes) {
    filtered.strokes = filtered.strokes
      .filter((stroke) => stroke.type === "SOLID")
      .map((stroke) => {
        const processed = Object.assign({}, stroke);
        delete processed.gradientTransform;
        delete processed.gradientStops;
        if (stroke.type === "SOLID" && stroke.color) {
          // 检查color是否已经是字符串（已处理过的十六进制颜色）
          if (typeof stroke.color === "string") {
            processed.color = stroke.color;
          } else {
            processed.color = processColor(stroke.color);
          }
        }
        return processed;
      });
  }

  // 递归处理children
  if (filtered.children && Array.isArray(filtered.children)) {
    filtered.children = filtered.children.map((child) =>
      filterGradientProperties(child)
    );
  }

  return filtered;
}

// 获取节点信息的函数（包含不可见节点）
function getNodeInfoWithHidden(node) {
  let info = {
    id: node.id,
    name: node.name,
    type: node.type,
    width: Math.round(node.width),
    height: Math.round(node.height),
    x: Math.round(node.x),
    y: Math.round(node.y),
    rotation: Math.round(node.rotation),
    visible: node.visible,
  };

  // 添加可选属性
  if (node.fills) info.fills = node.fills;
  if (node.strokes) info.strokes = node.strokes;
  if (node.strokeWeight) info.strokeWeight = Math.round(node.strokeWeight);
  if (node.characters) info.text = node.characters;
  if (node.cornerRadius) info.cornerRadius = Math.round(node.cornerRadius);
  if (node.pointCount) info.pointCount = Math.round(node.pointCount);

  // 添加插件数据
  const cssStyle = node.getPluginData("common_css_style");
  const commonStyle = node.getPluginData("common_component_style");
  if (cssStyle) info.common_css_style = cssStyle;
  if (commonStyle) info.common_component_style = commonStyle;

  // 如果有子节点，递归获取所有子节点信息
  if ("children" in node) {
    info.children = node.children.map((child) => getNodeInfoWithHidden(child));
  }

  // 不在这里过滤渐变属性
  return info;
}

// 辅助函数：检查基础属性是否有效
function hasValidBasicProps(node) {
  const isValid = node.visible && node.width > 0 && node.height > 0;
  if (!isValid) {
    // console.log(`节点 ${node.name}(${node.id}) 基础属性检查未通过:`, {
    //   visible: node.visible,
    //   width: node.width,
    //   height: node.height,
    // });
  }
  return isValid;
}

// 辅助函数：检查填充是否有效
function hasValidFills(fills) {
  if (!fills) {
    // console.log("fills 为空");
    return false;
  }

  const hasValidFill = fills.some((fill) => {
    // 只处理纯色填充，过滤掉渐变
    if (fill.type !== "SOLID") {
      // console.log("填充类型不是纯色:", fill.type);
      return false;
    }

    // 处理字符串格式的颜色（十六进制）
    if (typeof fill.color === "string" && fill.color.startsWith("#")) {
      return fill.visible !== false && fill.opacity > 0;
    }

    // 确保color对象存在
    if (!fill.color || typeof fill.color !== "object") {
      // console.log("填充缺少有效的颜色对象:", fill);
      return false;
    }

    const colorAlpha = typeof fill.color.a === "number" ? fill.color.a : 1;
    const isValid =
      fill.visible !== false && fill.opacity > 0 && colorAlpha > 0;

    if (!isValid) {
      // console.log("fill 无效:", {
      //   visible: fill.visible,
      //   opacity: fill.opacity,
      //   type: fill.type,
      //   colorAlpha: colorAlpha,
      // });
    }
    return isValid;
  });

  if (!hasValidFill) {
    // console.log("所有 fills 都无效");
  }
  return hasValidFill;
}

// 辅助函数：检查描边是否有效
function hasValidStrokes(strokes, strokeWeight) {
  if (!strokes) {
    // console.log("strokes 为空");
    return false;
  }

  const hasValidStroke = strokes.some((stroke) => {
    // 处理字符串格式的颜色（十六进制）
    if (
      stroke.type === "SOLID" &&
      typeof stroke.color === "string" &&
      stroke.color.startsWith("#")
    ) {
      return (
        stroke.visible !== false &&
        strokeWeight !== undefined &&
        strokeWeight > 0
      );
    }

    // 检查SOLID类型的描边是否有有效color对象
    if (
      stroke.type === "SOLID" &&
      (!stroke.color || typeof stroke.color !== "object")
    ) {
      // console.log("描边缺少有效的颜色对象:", stroke);
      return false;
    }

    const colorAlpha =
      stroke.type === "SOLID"
        ? typeof stroke.color.a === "number"
          ? stroke.color.a
          : 1
        : 1;

    const isValid =
      stroke.visible !== false &&
      strokeWeight !== undefined &&
      strokeWeight > 0 &&
      (stroke.type === "SOLID" ? colorAlpha > 0 : true);

    if (!isValid) {
      // console.log("stroke 无效:", {
      //   visible: stroke.visible,
      //   strokeWeight: strokeWeight,
      //   type: stroke.type,
      //   colorAlpha: colorAlpha,
      // });
    }
    return isValid;
  });

  if (!hasValidStroke) {
    // console.log("所有 strokes 都无效");
  }
  return hasValidStroke;
}

// 辅助函数：检查文本是否有效
function hasValidText(text) {
  const isValid = text && text.trim().length > 0;
  if (!isValid) {
    // console.log("文本无效:", {
    //   text: text,
    //   length: text ? text.trim().length : 0,
    // });
  }
  return isValid;
}

// 辅助函数：检查圆角是否有效
function hasValidCornerRadius(radius) {
  const isValid = radius !== undefined && radius > 0;
  if (!isValid) {
    // console.log("圆角无效:", {
    //   radius: radius,
    // });
  }
  return isValid;
}

// 辅助函数：检查点数是否有效
function hasValidPointCount(count) {
  const isValid = count !== undefined && count > 0;
  if (!isValid) {
    // console.log("点数无效:", {
    //   count: count,
    // });
  }
  return isValid;
}

// 辅助函数：检查插件数据是否有效
function hasValidPluginData(data) {
  const isValid = data && data.trim().length > 0;
  if (!isValid) {
    // console.log("插件数据无效:", {
    //   data: data,
    //   length: data ? data.trim().length : 0,
    // });
  }
  return isValid;
}

// 辅助函数：获取基础信息
function getBasicInfo(node) {
  const info = {
    name: node.name,
    type: node.type,
    width: Math.round(node.width),
    height: Math.round(node.height),
    x: Math.round(node.x),
    y: Math.round(node.y),
  };

  if (node.rotation !== 0) {
    info.rotation = Math.round(node.rotation);
  }

  return info;
}

// 辅助函数：处理渐变变换矩阵
function processGradientTransform(transform) {
  if (!transform || !Array.isArray(transform)) return null;

  // 渐变变换矩阵通常包含6个值：[a, b, c, d, e, f]
  // 分别代表：
  // [水平缩放, 水平倾斜, 垂直倾斜, 垂直缩放, 水平位移, 垂直位移]
  return transform.map((value) => Math.round(value * 100) / 100);
}

// 辅助函数：处理填充信息
function processFills(node, info) {
  if (node.fills && hasValidFills(node.fills)) {
    const visibleFills = node.fills
      .filter((fill) => {
        // 只处理纯色填充，过滤掉渐变
        if (fill.type !== "SOLID") {
          return false;
        }

        // 确保颜色对象和alpha值有效
        if (!fill.color || typeof fill.color !== "object") {
          // 如果是字符串格式的十六进制颜色，则视为有效
          if (typeof fill.color === "string" && fill.color.startsWith("#")) {
            return fill.visible !== false && fill.opacity > 0;
          }
          console.error(`填充缺少颜色对象:`, fill);
          return false;
        }

        const colorAlpha = typeof fill.color.a === "number" ? fill.color.a : 1;
        return fill.visible !== false && fill.opacity > 0 && colorAlpha > 0;
      })
      .map((fill) => {
        const processed = Object.assign({}, fill);

        // 处理纯色
        if (fill.type === "SOLID" && fill.color) {
          // 检查color是否已经是字符串（已处理过的十六进制颜色）
          if (typeof fill.color === "string") {
            processed.color = fill.color;
          } else {
            processed.color = processColor(fill.color);
          }
        }

        // 处理不透明度
        if (typeof processed.opacity === "number") {
          processed.opacity = Math.round(processed.opacity * 100) / 100;
        }

        return processed;
      });

    if (visibleFills.length > 0) {
      info.fills = visibleFills;
    } else {
      // console.log(`节点 ${node.name}(${node.id}) 的所有填充都被过滤掉了`);
    }
  }
}

// 辅助函数：处理描边信息
function processStrokes(node, info) {
  if (node.strokes && hasValidStrokes(node.strokes, node.strokeWeight)) {
    const visibleStrokes = node.strokes
      .filter((stroke) => {
        // 确保颜色对象有效
        if (
          stroke.type === "SOLID" &&
          (!stroke.color || typeof stroke.color !== "object")
        ) {
          // 如果是字符串格式的十六进制颜色，则视为有效
          if (
            typeof stroke.color === "string" &&
            stroke.color.startsWith("#")
          ) {
            return (
              stroke.visible !== false &&
              node.strokeWeight !== undefined &&
              node.strokeWeight > 0
            );
          }
          console.error(`描边缺少颜色对象:`, stroke);
          return false;
        }

        const colorAlpha =
          stroke.type === "SOLID"
            ? typeof stroke.color.a === "number"
              ? stroke.color.a
              : 1
            : 1;

        return (
          stroke.visible !== false &&
          node.strokeWeight !== undefined &&
          node.strokeWeight > 0 &&
          (stroke.type === "SOLID" ? colorAlpha > 0 : true)
        );
      })
      .map((stroke) => {
        const processed = Object.assign({}, stroke);

        if (stroke.type === "SOLID" && stroke.color) {
          // 检查color是否已经是字符串（已处理过的十六进制颜色）
          if (typeof stroke.color === "string") {
            processed.color = stroke.color;
          } else {
            processed.color = processColor(stroke.color);
          }
        }

        if (typeof processed.opacity === "number") {
          processed.opacity = Math.round(processed.opacity * 100) / 100;
        }
        return processed;
      });

    if (visibleStrokes.length > 0) {
      info.strokes = visibleStrokes;
      info.strokeWeight = Math.round(node.strokeWeight);
    } else {
      // console.log(`节点 ${node.name}(${node.id}) 的所有描边都被过滤掉了`);
    }
  }
}

// 辅助函数：处理插件数据
function processPluginData(node, info) {
  const cssStyle = node.getPluginData("common_css_style");
  const commonStyle = node.getPluginData("common_component_style");

  if (hasValidPluginData(cssStyle)) {
    info.common_css_style = cssStyle;
  }
  if (hasValidPluginData(commonStyle)) {
    info.common_component_style = commonStyle;
  }
}

// 辅助函数：检查节点是否有有效内容
function hasValidContent(info) {
  const isValid = !!(
    info.fills ||
    info.strokes ||
    info.text ||
    info.children ||
    info.common_css_style ||
    info.common_component_style
  );

  if (!isValid) {
    // console.log("节点内容无效:", {
    //   hasFills: !!info.fills,
    //   hasStrokes: !!info.strokes,
    //   hasText: !!info.text,
    //   hasChildren: !!info.children,
    //   hasCssStyle: !!info.common_css_style,
    //   hasComponentStyle: !!info.common_component_style,
    // });
  }
  return isValid;
}

// 获取节点信息的函数
function getNodeInfo(node) {
  // console.log(`\n开始处理节点: ${node.name}(${node.id})`);

  // 基础可见性检查
  if (!hasValidBasicProps(node)) {
    // console.log(`节点 ${node.name}(${node.id}) 因基础属性检查未通过而被过滤`);
    return null;
  }

  // 获取基础信息
  const info = getBasicInfo(node);

  // 处理各种属性
  processFills(node, info);
  processStrokes(node, info);

  // 处理文本内容
  if (node.characters) {
    if (hasValidText(node.characters)) {
      info.text = node.characters.trim();
    } else {
      // console.log(`节点 ${node.name}(${node.id}) 的文本内容无效`);
    }
  }

  // 处理圆角
  if (node.cornerRadius !== undefined) {
    if (hasValidCornerRadius(node.cornerRadius)) {
      info.cornerRadius = Math.round(node.cornerRadius);
    } else {
      // console.log(`节点 ${node.name}(${node.id}) 的圆角无效`);
    }
  }

  // 处理点数
  if (node.pointCount !== undefined) {
    if (hasValidPointCount(node.pointCount)) {
      info.pointCount = Math.round(node.pointCount);
    } else {
      // console.log(`节点 ${node.name}(${node.id}) 的点数无效`);
    }
  }

  // 处理插件数据
  processPluginData(node, info);

  // 处理子节点
  if ("children" in node) {
    // console.log(`处理节点 ${node.name}(${node.id}) 的子节点`);
    const childrenInfo = node.children
      .map((child) => {
        const childInfo = getNodeInfo(child);
        if (childInfo === null) {
          // console.log(`子节点 ${child.name}(${child.id}) 被过滤掉`);
        }
        return childInfo;
      })
      .filter((child) => child !== null);

    if (childrenInfo.length > 0) {
      info.children = childrenInfo;
    } else {
      // console.log(`节点 ${node.name}(${node.id}) 的所有子节点都被过滤掉了`);
    }
  }

  // 最终有效性检查
  if (!hasValidContent(info)) {
    // console.log(`节点 ${node.name}(${node.id}) 因内容无效而被过滤`);
    return null;
  }

  // console.log(`节点 ${node.name}(${node.id}) 处理完成，通过所有检查`);

  try {
    // 在这里添加过滤渐变相关属性的步骤
    const filteredInfo = filterGradientProperties(info);
    // console.log(`节点 ${node.name} 过滤渐变属性后的数据:`, filteredInfo);
    return filteredInfo;
  } catch (error) {
    console.error(`处理节点 ${node.name} 时出错:`, error);
    return null;
  }
}

// 处理从UI接收的消息
figma.ui.onmessage = async (msg) => {
  if (msg.type === "get-all-nodes-with-hidden") {
    // 先发送清空消息
    figma.ui.postMessage({
      type: "clear-selection-info",
    });

    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      figma.ui.postMessage({
        type: "selection-info",
        data: {
          message: "没有选中任何内容",
        },
      });
      return;
    }

    // 获取所有选中节点及其子节点的信息（包含不可见节点）
    const allNodesInfo = selection.map((node) => getNodeInfoWithHidden(node));

    // 发送所有节点信息到UI
    figma.ui.postMessage({
      type: "selection-info",
      data: allNodesInfo,
    });
  } else if (msg.type === "get-all-nodes") {
    // 先发送清空消息
    figma.ui.postMessage({
      type: "clear-selection-info",
    });

    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      figma.ui.postMessage({
        type: "selection-info",
        data: {
          message: "没有选中任何内容",
        },
      });
      return;
    }

    // 获取所有选中节点及其子节点的信息，并过滤掉不可见的节点
    const allNodesInfo = selection
      .map((node) => getNodeInfo(node))
      .filter((info) => info !== null); // 过滤掉不可见的顶层节点

    // console.log("处理完成，准备发送数据:", allNodesInfo);

    // 发送所有节点信息到UI
    figma.ui.postMessage({
      type: "selection-info",
      data: allNodesInfo,
    });

    // console.log("数据已发送到UI");
  } else if (msg.type === "get-selection") {
    // 先发送清空消息
    figma.ui.postMessage({
      type: "clear-selection-info",
    });

    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      figma.ui.postMessage({
        type: "selection-info",
        data: {
          message: "没有选中任何内容",
        },
      });
      return;
    }

    // 获取选中节点的信息
    const selectionInfo = selection.map((node) => {
      const info = {
        id: node.id,
        name: node.name,
        type: node.type,
        width: node.width,
        height: node.height,
        x: node.x,
        y: node.y,
        rotation: node.rotation,
      };

      // 添加可选属性
      if (node.fills) info.fills = node.fills;
      if (node.strokes) info.strokes = node.strokes;
      if (node.strokeWeight) info.strokeWeight = node.strokeWeight;
      if (node.characters) info.text = node.characters;
      if (node.cornerRadius) info.cornerRadius = node.cornerRadius;
      if (node.pointCount) info.pointCount = node.pointCount;

      // 添加插件数据
      const cssStyle = node.getPluginData("common_css_style");
      const commonStyle = node.getPluginData("common_component_style");
      if (cssStyle) info.common_css_style = cssStyle;
      if (commonStyle) info.common_component_style = commonStyle;

      return info;
    });

    // 发送选中内容到UI
    figma.ui.postMessage({
      type: "selection-info",
      data: selectionInfo,
    });
  } else if (msg.type === "add-tag") {
    try {
      const selection = figma.currentPage.selection;

      if (selection.length === 0) {
        figma.notify("请先选择一个元素");
        return;
      }

      // 为每个选中的元素添加属性
      for (const node of selection) {
        // 根据分组类型添加不同的字段
        if (msg.groupType === "样式") {
          node.setPluginData("common_css_style", msg.tagType);
        } else if (msg.groupType === "组件") {
          node.setPluginData("common_component_style", msg.tagType);
        }
      }

      // 通知用户
      figma.notify(`已为选中元素添加${msg.groupType}标识: ${msg.tagType}`);

      // 发送标签已添加的消息
      figma.ui.postMessage({
        type: "tag-added",
      });
    } catch (error) {
      console.error("添加标签时出错:", error);
      figma.notify("添加标签时出错，请稍后再试");
    }
  } else if (msg.type === "clear-tag") {
    try {
      const selection = figma.currentPage.selection;

      if (selection.length === 0) {
        figma.notify("请先选择一个元素");
        return;
      }

      let clearedCount = 0;
      // 为每个选中的元素清除标签
      for (const node of selection) {
        const hasCommonCssStyle = node.getPluginData("common_css_style");
        const hasCommonCommonStyle = node.getPluginData(
          "common_component_style"
        );

        if (hasCommonCssStyle || hasCommonCommonStyle) {
          if (hasCommonCssStyle) {
            node.setPluginData("common_css_style", "");
          }
          if (hasCommonCommonStyle) {
            node.setPluginData("common_component_style", "");
          }
          clearedCount++;
        }
      }

      // 通知用户
      if (clearedCount > 0) {
        figma.notify(`已清除 ${clearedCount} 个元素的标签`);
      } else {
        figma.notify("选中的元素没有可清除的标签");
      }

      // 发送标签已清除的消息
      figma.ui.postMessage({
        type: "tags-cleared",
      });
    } catch (error) {
      console.error("清除标签时出错:", error);
      figma.notify("清除标签失败: " + error.message);
    }
  } else if (msg.type === "close-plugin") {
    figma.closePlugin();
  }
};
