import { defineType, defineField, defineArrayMember } from 'sanity'

export const postSchema = defineType({
  name: 'post',
  title: 'Blog Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'readTime',
      title: 'Reading Time',
      type: 'string',
      description: 'e.g. "6 min read"',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        {
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
        },
        {
          name: 'placeholderUrl',
          title: 'Placeholder URL (picsum.photos fallback)',
          type: 'url',
          description: 'Temporary image URL used until a real image is uploaded',
        },
      ],
    }),
    defineField({
      name: 'body',
      title: 'Body Content',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
            { title: 'Quote', value: 'blockquote' },
          ],
          lists: [
            { title: 'Bullet', value: 'bullet' },
            { title: 'Numbered', value: 'number' },
          ],
          marks: {
            decorators: [
              { title: 'Bold', value: 'strong' },
              { title: 'Italic', value: 'em' },
            ],
            annotations: [
              {
                name: 'link',
                title: 'Link',
                type: 'object',
                fields: [
                  {
                    name: 'href',
                    title: 'URL',
                    type: 'url',
                  },
                ],
              },
            ],
          },
        }),
        defineArrayMember({
          type: 'image',
          title: 'Inline Image',
          options: { hotspot: true },
          fields: [
            {
              name: 'alt',
              title: 'Alt Text',
              type: 'string',
            },
            {
              name: 'caption',
              title: 'Caption',
              type: 'string',
            },
            {
              name: 'placeholderUrl',
              title: 'Placeholder URL (picsum.photos fallback)',
              type: 'url',
              description: 'Temporary image URL used until a real image is uploaded',
            },
          ],
        }),
        defineArrayMember({
          type: 'object',
          name: 'sectionImage',
          title: 'Section Break Image',
          fields: [
            {
              name: 'image',
              title: 'Image',
              type: 'image',
              options: { hotspot: true },
            },
            {
              name: 'placeholderUrl',
              title: 'Placeholder URL (picsum.photos fallback)',
              type: 'url',
              description: 'Temporary image URL used until a real image is uploaded. e.g. https://picsum.photos/seed/keyword/800/400',
            },
            {
              name: 'caption',
              title: 'Caption',
              type: 'string',
            },
            {
              name: 'alt',
              title: 'Alt Text',
              type: 'string',
            },
          ],
          preview: {
            select: {
              title: 'caption',
              media: 'image',
            },
            prepare({ title, media }) {
              return {
                title: title || 'Section Image',
                subtitle: 'Section break image',
                media,
              }
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'metaTitle',
      title: 'Custom Meta Title (SEO)',
      type: 'string',
      description: 'Overrides the auto-generated meta title',
    }),
    defineField({
      name: 'metaDescription',
      title: 'Custom Meta Description (SEO)',
      type: 'text',
      rows: 2,
      description: 'Overrides the auto-generated meta description',
    }),
    defineField({
      name: 'keywords',
      title: 'Meta Keywords',
      type: 'string',
      description: 'Comma-separated keywords for SEO',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'category',
      media: 'featuredImage',
    },
  },
  orderings: [
    {
      title: 'Published Date',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
})
