import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Pixel Innov",
  version: packageJson.version,
  copyright: `© ${currentYear}, Pixel Innov.`,
  meta: {
    title: "Pixel Innov - Dashboard de suivie",
    description:
      "Ce dashboard à été concu pour le suivie de vos transaction.",
  },
};
