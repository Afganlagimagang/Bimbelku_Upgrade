export const seoAbsoluteUrl = (value: string) => {
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(value.startsWith("/") ? value : `/${value}`, window.location.origin).toString();
};
