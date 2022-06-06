import { NextSeo } from "next-seo";
import { isMultiLanguage } from "../../lib/isMultiLanguage";
import { getPreview } from "../../lib/getPreview";
import { getPaths } from "../../lib/getPaths";
import {
  getCurrentLocaleStore,
  globalDrupalStateAuthStores,
  globalDrupalStateStores,
} from "../../lib/drupalStateContext";

import Article from "../../components/article.js";
import Layout from "../../components/layout";

export default function ArticleTemplate({ title, body, imgSrc, hrefLang }) {
  return (
    <Layout>
      <NextSeo
        title="Decoupled Next Drupal Demo"
        description="Generated by create next app."
        languageAlternates={hrefLang}
      />
      <Article title={title} body={body} imgSrc={imgSrc} />
    </Layout>
  );
}

export async function getStaticPaths(context) {
  try {
    const paths = await getPaths(
      context,
      globalDrupalStateStores,
      "node--article",
      "slug",
      "articles"
    );

    return {
      paths,
      fallback: false,
    };
  } catch (error) {
    console.error("Failed to fetch paths for articles:", error);
  }
}

export async function getStaticProps(context) {
  const { locales, locale } = context;
  const multiLanguage = isMultiLanguage(locales);
  const lang = context.preview ? context.previewData.previewLang : locale;

  const store = getCurrentLocaleStore(
    lang,
    context.preview ? globalDrupalStateAuthStores : globalDrupalStateStores
  );

  const slug = `/articles/${context.params.slug[0]}`;

  store.params.clear();
  // if preview, use preview endpoint and add to store.
  store.params.addInclude(["field_media_image.field_media_image"]);
  context.preview && (await getPreview(context, "node--article"));

  const article = await store.getObjectByPath({
    objectName: "node--article",
    // Prefix the slug with the current locale
    path: `${multiLanguage ? lang : ""}${slug}`,
    query: `
        {
          id
          title
          body
          path {
            alias
            langcode
          }
          field_media_image {
            field_media_image {
              uri {
                url
              }
            }
          }
        }
      `,
    // if preview is true, force a fetch to Drupal
    refresh: context.preview,
  });

  store.params.clear();

  const origin = process.env.NEXT_PUBLIC_FRONTEND_URL;
  // Load all the paths for the current article.
  const paths = locales.map(async (locale) => {
    const localeStore = getCurrentLocaleStore(
      locale,
      context.preview ? globalDrupalStateAuthStores : globalDrupalStateStores
    );
    const { path } = await localeStore.getObject({
      objectName: "node--article",
      id: article.id,
    });
    return path;
  });

  // Resolve all promises returned as part of paths
  // and prepare hrefLang.
  const hrefLang = await Promise.all(paths).then((values) => {
    return values.map((value) => {
      return {
        hrefLang: value.langcode,
        href: origin + "/" + value.langcode + value.alias,
      };
    });
  });

  return {
    props: {
      title: article.title,
      body: article.body.value,
      imgSrc: article.field_media_image?.field_media_image?.uri?.url || "",
      hrefLang,
      revalidate: 60,
    },
  };
}
