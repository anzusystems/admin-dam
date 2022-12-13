import type { LocaleCode } from '@/composables/system/localeSettings'

export function useFlagsSvg() {
  // source: https://github.com/hampusborgos/country-flags

  const sk =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600"><path fill="#ee1c25" d="M0 0h900v600H0z"/><path fill="#0b4ea2" d="M0 0h900v400H0z"/><path fill="#fff" d="M0 0h900v200H0z"/><path d="M393.479 141H146.358l-.847 8.059c-.184 1.752-4.511 43.971-4.511 136.69 0 43.563 14.726 82 43.77 114.23 20.349 22.585 46.923 41.6 81.242 58.129l3.9 1.881 3.906-1.881c34.32-16.53 60.9-35.544 81.246-58.129 29.044-32.234 43.771-70.667 43.771-114.23 0-92.718-4.328-134.938-4.512-136.69l-.844-8.059z" fill="#fff"/><path d="M269.917 450C220.577 426.234 150 379.062 150 285.749S154.461 150 154.461 150h230.915s4.463 42.437 4.463 135.749S319.261 426.234 269.917 450z" fill="#ee1c25"/><path d="M280.484 261.284c13.36.216 39.425.739 62.635-7.027 0 0-.613 8.306-.613 17.98s.613 17.982.613 17.982c-21.289-7.125-47.58-7.273-62.635-7.082v51.539h-21.1v-51.539c-15.055-.191-41.345-.043-62.635 7.082 0 0 .613-8.305.613-17.982s-.613-17.98-.613-17.98c23.21 7.766 49.275 7.243 62.635 7.027v-32.368c-12.177-.108-29.723.473-49.563 7.113 0 0 .613-8.305.613-17.982s-.613-17.981-.613-17.981c19.81 6.628 37.336 7.219 49.509 7.114-.626-20.5-6.6-46.332-6.6-46.332s12.289.959 17.2.959 17.2-.959 17.2-.959-5.969 25.835-6.6 46.33c12.174.106 29.7-.485 49.509-7.114 0 0-.613 8.305-.613 17.981s.613 17.982.613 17.982c-19.839-6.639-37.386-7.221-49.563-7.113v32.37z" fill="#fff"/><path d="M269.9 329.094c-24.852 0-38.163 34.469-38.163 34.469a30.466 30.466 0 0 0-27.661-16.344c-13.719 0-23.829 12.2-30.256 23.5 24.959 39.7 64.78 64.207 96.079 79.281 31.305-15.075 71.152-39.571 96.112-79.281-6.427-11.3-16.537-23.5-30.256-23.5a30.539 30.539 0 0 0-27.693 16.344s-13.308-34.469-38.162-34.469z" fill="#0b4ea2"/></svg>'
  const cz =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600"><rect width="900" height="600" fill="#d7141a"/><rect width="900" height="300" fill="#fff"/><path d="M 450,300 0,0 V 600 z" fill="#11457e"/></svg>'
  // const gb =
  //   '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30"><clipPath id="a"><path d="M0 0v30h60V0z"/></clipPath><clipPath id="b"><path d="M30 15h30v15zv15H0zH0V0zV0h30z"/></clipPath><g clip-path="url(#a)"><path d="M0 0v30h60V0z" fill="#012169"/><path d="M0 0l60 30m0-30L0 30" stroke="#fff" stroke-width="6"/><path d="M0 0l60 30m0-30L0 30" clip-path="url(#b)" stroke="#C8102E" stroke-width="4"/><path d="M30 0v30M0 15h60" stroke="#fff" stroke-width="10"/><path d="M30 0v30M0 15h60" stroke="#C8102E" stroke-width="6"/></g></svg>'
  const us =
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 7410 3900"><path fill="#b22234" d="M0 0h7410v3900H0z"/><path d="M0 450h7410m0 600H0m0 600h7410m0 600H0m0 600h7410m0 600H0" stroke="#fff" stroke-width="300"/><path fill="#3c3b6e" d="M0 0h2964v2100H0z"/><g fill="#fff"><g id="d"><g id="c"><g id="e"><g id="b"><path id="a" d="M247 90l70.534 217.082-184.66-134.164h228.253L176.466 307.082z"/><use xlink:href="#a" y="420"/><use xlink:href="#a" y="840"/><use xlink:href="#a" y="1260"/></g><use xlink:href="#a" y="1680"/></g><use xlink:href="#b" x="247" y="210"/></g><use xlink:href="#c" x="494"/></g><use xlink:href="#d" x="988"/><use xlink:href="#c" x="1976"/><use xlink:href="#e" x="2470"/></g></svg>'
  const xx =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600"><rect width="900" height="600" fill="#cccccc"/></svg>'

  const getLocaleFlag = (name: LocaleCode) => {
    switch (name) {
      case 'sk':
        return sk
      case 'cz':
        return cz
      case 'en':
        return us
      case 'xx':
        return xx
    }
  }

  return {
    getLocaleFlag,
  }
}
