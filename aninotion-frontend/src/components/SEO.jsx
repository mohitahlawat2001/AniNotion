import React from 'react';
import { Helmet } from '@slorber/react-helmet-async';

const SEO = ({ 
  title, 
  description, 
  image, 
  url, 
  type = 'website',
  article = null,
  author = null,
  tags = [],
  publishedTime = null,
  modifiedTime = null
}) => {
  const siteUrl = import.meta.env.VITE_APP_URL || 'https://aninotion.com';
  const siteName = 'AniNotion';
  const defaultDescription = 'Discover and explore detailed anime reviews, guides, and insights on AniNotion';
  const defaultImage = `${siteUrl}/og-image.jpg`;
  
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const fullImage = image || defaultImage;
  const fullDescription = description || defaultDescription;
  const fullTitle = title ? `${title} | ${siteName}` : siteName;

  // Generate structured data for articles
  const structuredData = type === 'article' && article ? {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": fullDescription,
    "image": fullImage,
    "url": fullUrl,
    "datePublished": publishedTime,
    "dateModified": modifiedTime || publishedTime,
    "author": author ? {
      "@type": "Person",
      "name": author
    } : {
      "@type": "Organization",
      "name": siteName
    },
    "publisher": {
      "@type": "Organization",
      "name": siteName,
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/logo.png`
      }
    },
    "keywords": tags.join(', ')
  } : null;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      <link rel="canonical" href={fullUrl} />
      
      {/* Keywords */}
      {tags.length > 0 && (
        <meta name="keywords" content={tags.join(', ')} />
      )}

      {/* Open Graph Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content={siteName} />
      
      {/* Article specific OG tags */}
      {type === 'article' && publishedTime && (
        <>
          <meta property="article:published_time" content={publishedTime} />
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {author && <meta property="article:author" content={author} />}
          {tags.map(tag => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={fullImage} />
      
      {/* Additional SEO Tags */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow" />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
