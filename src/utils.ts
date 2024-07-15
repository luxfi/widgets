export const query2obj = (str: string) => {
  const res: Record<string, string> = {};
  str.replace(/([^=?#&]*)=([^?#&]*)/g, function (_, $1: string, $2: string) {
    res[decodeURIComponent($1)] = decodeURIComponent($2);
    return "";
  });
  return res;
};

export const obj2query = (obj: Record<string, string>) => {
  return Object.keys(obj)
    .map(function (key) {
      return encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]);
    })
    .join("&");
};

export const isUrlMatched = (
  url: string,
  includes: string[]
): string | null => {
  const originWithPath = url.split("?")[0];
  const index = includes.findIndex((include) => {
    // TODO: support fuzzy matching
    return include === originWithPath;
  });
  if (index !== -1) return includes[index];
  return null;
};

export const throttle = (fn, delay) => {
  let timer = null;
  return (...args) => {
    if (!timer) {
      timer = setTimeout(() => {
        fn.apply(this, args);
        timer = null;
      }, delay);
    }
  };
};
