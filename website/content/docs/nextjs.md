---
title: NextJS
weight: 20
group: guides
---

This guide will help you get started using Netlify CMS with NextJS.

## Creating a new project
Let's repeat some of the basics of setting up a simple NextJS project (check out [nextjs.org/learn](http://nextjs.org/learn) for a more detailed version).

```bash
# Create new directory and navigate into it
mkdir awesome-kitties
cd awesome-kitties

# Initialize a new project
npm init -y

# Install required dependencies
npm install --save react react-dom next

# Intall webpack loader for Markdown
npm install --save-dev frontmatter-markdown-loader

# Create folder for pages (default for NextJS), and add a index file
mkdir pages
touch pages/index.js

# Create a folder for content, and a markdown file:
mkdir content
touch content/home.md

#Create a folder for static assets
mkdir static

```

Next, we need to add some modifications to our ``package.json`` file to make it easier to run and deploy our new site:

```json
{
  "scripts": {
    "dev": "next",
    "build": "next build",
    "start": "next start",
    "export": "npm run build && next export"
  }
}
```

There is a lot of different ways to create and display Markdown content, but to make this as easy as possible we'll be using a webpack-loader that enables us to load markdown files directly in our React components ([frontmatter-markdown-loader](https://www.npmjs.com/package/frontmatter-markdown-loader)). 

Add the following content to your ```content/home.md``` file:

```md
---
title: Awesome kitties
date: 2019-03-17T19:31:20.591Z
cats:
  - description: 'Maru is a Scottish Fold from Japan, and he loves boxes.'
    name: Maru (まる)
  - description: Lil Bub is an American celebrity cat known for her unique appearance.
    name: Lil Bub
  - description: 'Grumpy cat is an American celebrity cat known for her grumpy appearance. '
    name: Grumpy cat (Tardar Sauce)
---
Welcome to my awesome page about cats of the internet. 

This page is built with NextJS, and content is managed in Netlify CMS

```

Next, we need to tell webpack how to load Markdown files. Create a new ```next.config.js``` file at the root of your project with the following content:

```js
module.exports = {
    webpack: (cfg) => {
        cfg.module.rules.push(
            {
                test: /\.md$/,
                use: 'frontmatter-markdown-loader'
            }
        )
        return cfg;
    }
}
```

Almost there! The last thing we need to do is to add some content our ```pages/index.js``` file. With a little help of our webpack loader, we can now easilly import Markdown files:

```js
import React, { Component } from 'react'
import content from '../content/home.md';

export default class Home extends Component {
  render() {
    let { html , attributes:{ title, cats } } = content;
    return (
      <article>
          <h1>{title}</h1>
          <div dangerouslySetInnerHTML={{ __html: html }}/>
          <ul>
              { cats.map((cat, k) => (
                  <li key={k}>
                    <h2>{cat.name}</h2>
                    <p>{cat.description}</p>
                  </li>
              ))}
          </ul>
      </article>
    )
  }
}

```
Great! We now have a page that displays content from our Markdown file. Go ahead and start your development server to test if everything is working:

```bash
npm run dev
```

## Adding Netlify CMS

There are many different ways to add Netlify CMS to your project. The easiest is probably just to embed it from a CDN, and that's exactly what we're gonna do. To avoid making this guide too complicated, we're just going to add Netlify into a subfolder inside the ```/static``` directory (which is just served as static files by Next):

```bash
# Create and navigate into static/admin folder
mkdir static/admin
cd static/admin

# Create index.html and config.yml file
touch index.html
touch config.yml
```

Paste HTML for Netlify CMS into your ``static/admin/index.html`` file (check out the [Add Netlify To Your Site](https://www.netlifycms.org/docs/add-to-your-site/) section for more information)

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Content Manager</title>
  <script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
</head>
<body>
  <!-- Include the script that builds the page and powers Netlify CMS -->
  <script src="https://unpkg.com/netlify-cms@^2.0.0/dist/netlify-cms.js"></script>
</body>
</html>
```
Notice that we also added the identity widget. This allows sign up when the project is hosted at Netlify.

Paste the following configuration into your```static/admin/config.yml``` file:

```yaml
backend:
  name: git-gateway
  branch: master
media_folder: static/img
collections:
  - name: "pages"
    label: "Pages"
    files:
    - label: "Home"
      name: "home"
      file: "content/home.md"
      fields: 
        - { label: "Title", name: "title", widget: "string"}
        - { label: "Publish Date", name: "date", widget: "datetime" }
        - { label: "Body", name: "body", widget: "markdown"}
        - label: 'Cats'
          name: "cats"
          widget: list
          fields: 
            - { label: "Name", name: "name", widget: "string"}
            - { label: "Description", name: "description", widget: "text"}
```

Awesome! Netlify CMS should now be available at ```localhost:3000/static/admin/index.html```.
Unfortunately we can't edit our content just yet. First we need to move our code into a git repository, and create a new Netlify site.

**Tip:** If you want to test changes made to your config.yml file locally, swap out "git-gateway" with "test-repo" and navigate to ```localhost:3000/static/admin/index.html``` to view Netlify CMS locally (you can't make changes or read actual content from Git this way, but it's great to verify how things will look).

## Publishing to GitHub and Netlify

Create a new repository at GitHub (or one of the other supported git services) and follow the instructions on how to push existing files into your new repository.

Now is probably also a good time to add a ```.gitignore``` file:

```
.next/
node_modules/
/npm-debug.log
.DS_Store
out/
```


When your project is under version control, go to Netlify and select "New Site from Git". 
Select GitHub (or whatever service you used in the previous step), and the repository you just pushed to.

Under the final step (Build options, and deploy!), make sure you enter the following:

| Field | Value |
|-------|-------|
| Build command | **npm run export** |
| Publish directory | **out** |


### Enable Identity and Git Gateway

Netlify's Identity and Git Gateway services allow you to manage CMS admin users for your site without requiring them to have an account with your Git host or commit access on your repo. From your site dashboard on Netlify:

1. Go to **Settings > Identity**, and select **Enable Identity service**.
2. Under **Registration preferences**, select **Open** or **Invite only**. In most cases, you want only invited users to access your CMS, but if you're just experimenting, you can leave it open for convenience.
3. If you'd like to allow one-click login with services like Google and GitHub, check the boxes next to the services you'd like to use, under **External providers**.
4. Scroll down to **Services > Git Gateway**, and click **Enable Git Gateway**. This authenticates with your Git host and generates an API access token. In this case, we're leaving the **Roles** field blank, which means any logged in user may access the CMS. For information on changing this, check the [Netlify Identity documentation](https://www.netlify.com/docs/identity/).

### Celebrate!
Great job - you did it! 
Open your new page via the new Netlify URL, and navigate to ```/static/admin```. If you did everything correct in the previous step, you should now be able to sign up for an account, and log in. 

**Tip:** Signing up with an external provider is the easiest. If you want to sign up by email, you'll have to set up a redirect in your index.js page (which we won't be covering in this guide). For more information, have a look at the [Add To Your Site](https://www.netlifycms.org/docs/add-to-your-site) section.

Congratulations - you can finally manage your new list of cats!
