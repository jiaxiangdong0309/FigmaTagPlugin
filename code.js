// 当插件启动时显示UI
figma.showUI(__html__, { width: 320, height: 600 });

// 获取节点信息的函数（包含不可见节点）
function getNodeInfoWithHidden(node) {
  const info = {
    id: node.id,
    name: node.name,
    type: node.type,
    width: node.width,
    height: node.height,
    x: node.x,
    y: node.y,
    rotation: node.rotation,
    visible: node.visible,
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

  // 如果有子节点，递归获取所有子节点信息
  if ("children" in node) {
    info.children = node.children.map((child) => getNodeInfoWithHidden(child));
  }

  return info;
}

// 获取节点信息的函数
function getNodeInfo(node) {
  // 如果节点不可见，返回 null
  if (!node.visible) {
    return null;
  }

  const info = {
    id: node.id,
    name: node.name,
    type: node.type,
    width: node.width,
    height: node.height,
    x: node.x,
    y: node.y,
    rotation: node.rotation,
    visible: node.visible,
  };

  // 添加可选属性，并过滤掉不可见的fills和strokes
  if (node.fills) {
    const visibleFills = node.fills.filter((fill) => fill.visible !== false);
    if (visibleFills.length > 0) {
      info.fills = visibleFills;
    }
  }

  if (node.strokes) {
    // 过滤掉不可见的strokes和宽度为0的strokes
    const visibleStrokes = node.strokes.filter(
      (stroke) =>
        stroke.visible !== false &&
        node.strokeWeight !== undefined &&
        node.strokeWeight > 0
    );
    if (visibleStrokes.length > 0) {
      info.strokes = visibleStrokes;
      info.strokeWeight = node.strokeWeight;
    }
  }

  if (node.characters) info.text = node.characters;
  if (node.cornerRadius) info.cornerRadius = node.cornerRadius;
  if (node.pointCount) info.pointCount = node.pointCount;

  // 添加插件数据
  const cssStyle = node.getPluginData("common_css_style");
  const commonStyle = node.getPluginData("common_component_style");
  if (cssStyle) info.common_css_style = cssStyle;
  if (commonStyle) info.common_component_style = commonStyle;

  // 如果有子节点，递归获取子节点信息
  if ("children" in node) {
    const childrenInfo = node.children
      .map((child) => getNodeInfo(child))
      .filter((child) => child !== null); // 过滤掉不可见的子节点

    if (childrenInfo.length > 0) {
      info.children = childrenInfo;
    }
  }

  // 如果节点没有任何可见的fills和strokes，并且没有文本内容，也没有子节点，则返回null
  if (!info.fills && !info.strokes && !info.text && !info.children) {
    return null;
  }

  return info;
}

// 处理从UI接收的消息
figma.ui.onmessage = async (msg) => {
  if (msg.type === "get-all-nodes-with-hidden") {
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

    // 发送所有节点信息到UI
    figma.ui.postMessage({
      type: "selection-info",
      data: allNodesInfo,
    });
  } else if (msg.type === "get-selection") {
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

      // 如果需要更新选中内容
      if (msg.shouldUpdateSelection) {
        // 重新获取并发送选中内容
        const updatedSelectionInfo = selection.map((node) => {
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

        figma.ui.postMessage({
          type: "selection-info",
          data: updatedSelectionInfo,
        });
      }
    } catch (error) {
      console.error("添加标识时出错:", error);
      figma.notify("添加标识失败: " + error.message);
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

      // 如果需要更新选中内容
      if (msg.shouldUpdateSelection) {
        // 重新获取并发送选中内容
        const updatedSelectionInfo = selection.map((node) => {
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

        figma.ui.postMessage({
          type: "selection-info",
          data: updatedSelectionInfo,
        });
      }
    } catch (error) {
      console.error("清除标签时出错:", error);
      figma.notify("清除标签失败: " + error.message);
    }
  } else if (msg.type === "close-plugin") {
    figma.closePlugin();
  }
};

// 将十六进制颜色转换为RGB
function hexToRgb(hex) {
  // 移除可能的 # 符号
  hex = hex.replace(/^#/, "");

  // 解析3位或6位十六进制颜色
  let r, g, b;
  if (hex.length === 3) {
    r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
    g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
    b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else {
    return null; // 无效的十六进制颜色
  }

  return { r, g, b };
}

// 获取形状类型的中文名称
function getShapeTypeName(type) {
  switch (type) {
    case "rectangle":
      return "矩形";
    case "ellipse":
      return "圆形";
    case "text":
      return "文本";
    case "line":
      return "线条";
    case "polygon":
      return "多边形";
    default:
      return "形状";
  }
}
