const GTM_ID = import.meta.env.VITE_GTM_CONTAINER_ID as string | undefined
const CLARITY_ID = import.meta.env.VITE_CLARITY_PROJECT_ID as string | undefined
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined

export function initTracking() {
  if (GTM_ID) initGTM(GTM_ID)
  if (CLARITY_ID) initClarity(CLARITY_ID)
  if (GA_MEASUREMENT_ID) initGA4(GA_MEASUREMENT_ID)
}

function initGTM(id: string) {
  const script = document.createElement('script')
  script.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}')`
  document.head.appendChild(script)

  const noscript = document.createElement('noscript')
  const iframe = document.createElement('iframe')
  iframe.src = `https://www.googletagmanager.com/ns.html?id=${id}`
  iframe.height = '0'
  iframe.width = '0'
  iframe.style.display = 'none'
  iframe.style.visibility = 'hidden'
  noscript.appendChild(iframe)
  document.body.insertBefore(noscript, document.body.firstChild)
}

function initClarity(id: string) {
  const script = document.createElement('script')
  script.innerHTML = `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,'clarity','script','${id}')`
  document.head.appendChild(script)
}

function initGA4(id: string) {
  const gtagScript = document.createElement('script')
  gtagScript.async = true
  gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${id}`
  document.head.appendChild(gtagScript)

  const inline = document.createElement('script')
  inline.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','${id}')`
  document.head.appendChild(inline)
}
