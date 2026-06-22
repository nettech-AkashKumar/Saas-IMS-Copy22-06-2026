export const getSubdomain = () => {
  const host = window.location.hostname; // abc.mymunc.local
  const parts = host.split(".");
  return parts.length > 2 ? parts[0] : "imsmymunc";
};
