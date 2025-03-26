// 检查节点基础属性是否有效
function hasValidBasicProps(node) {
  return node.visible && node.width > 0 && node.height > 0;
}

// 检查填充是否有效
function hasValidFills(fills) {
  if (!fills || !Array.isArray(fills)) {
    return false;
  }
  return fills.some(function (fill) {
    return (
      fill.visible !== false &&
      fill.opacity > 0 &&
      (fill.type === "SOLID" ? fill.color && fill.color.a > 0 : true)
    );
  });
}

// 检查描边是否有效
function hasValidStrokes(strokes, strokeWeight) {
  if (!strokes || !Array.isArray(strokes)) {
    return false;
  }
  return strokes.some(function (stroke) {
    return (
      stroke.visible !== false &&
      strokeWeight !== undefined &&
      strokeWeight > 0 &&
      (stroke.type === "SOLID" ? stroke.color && stroke.color.a > 0 : true)
    );
  });
}

module.exports = {
  hasValidBasicProps,
  hasValidFills,
  hasValidStrokes,
};
