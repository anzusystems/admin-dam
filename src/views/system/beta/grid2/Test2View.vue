<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getData } from '@/views/system/beta/grid2/data'

const list = ref([])
const gridItems = ref(6)
const scrollTo = ref(500)

onMounted(async () => {
  //@ts-ignore
  list.value = getData(2000)
})
</script>

<template>
  <nav class="menu">
    <span class="package">
      <span class="package-name">vue-virtual-scroller</span>
    </span>
  </nav>

  <div class="wrapper">
    <div class="toolbar">
      <label>
        Grid items per row
        <input v-model.number="gridItems" type="number" min="2" max="20" />
      </label>
      <input v-model.number="gridItems" type="range" min="2" max="20" />
      <span>
        <button @mousedown="$refs.scroller.scrollToItem(scrollTo)">Scroll To:</button>
        <input v-model.number="scrollTo" type="number" min="0" :max="list.length - 1" />
      </span>
    </div>

    <!--    <RecycleScroller-->
    <!--      ref="scroller"-->
    <!--      class="scroller"-->
    <!--      :items="list"-->
    <!--      :item-size="128"-->
    <!--      :grid-items="gridItems"-->
    <!--      :item-secondary-size="100"-->
    <!--    >-->
    <!--      <template #default="{ item, index }">-->
    <!--        <div class="item">-->
    <!--          <img :key="item.id" :src="item.value.avatar" />-->
    <!--          <div class="index">-->
    <!--            {{ index }}-->
    <!--          </div>-->
    <!--        </div>-->
    <!--      </template>-->
    <!--    </RecycleScroller>-->
  </div>
</template>

<style>
html,
body,
#app {
  box-sizing: border-box;
  height: 100%;
}

body {
  font-size: 16px;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin: 0;
}

#app,
.page {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.menu {
  flex: auto 0 0;
  display: flex;
  align-items: center;
  gap: 2px;
}

.menu,
.page {
  padding: 12px;
  box-sizing: border-box;
}

.package {
  margin-right: 12px;
}

.package-name {
  font-family: monospace;
  color: #2c3e50;
  background: #eee;
  padding: 5px 12px 3px;
}

.package-name,
.menu a {
  display: inline-block;
  border-radius: 3px;
}

.menu a {
  padding: 4px 12px;
  text-decoration: none;
  color: white;
  background: #2c3e50;
}

.menu a.router-link-active {
  background: #42b983;
}

.menu a:not(:last-child) {
  margin-right: 4px;
}

.vue-recycle-scroller {
  -webkit-overflow-scrolling: touch;
}

.vue-recycle-scroller__item-container,
.vue-recycle-scroller__item-wrapper {
  box-sizing: border-box;
}

.vue-recycle-scroller__item-view {
  cursor: pointer;
  user-select: none;
  user-select: none;
  user-select: none;
}

.tr,
.td {
  box-sizing: border-box;
}

.vue-recycle-scroller__item-view .tr {
  display: flex;
  align-items: center;
}

.vue-recycle-scroller__item-view .td {
  display: block;
}

.vue-recycle-scroller__item-view.hover {
  background: #4fc08d;
  color: white;
}

.toolbar {
  flex: auto 0 0;
  text-align: center;
  margin-bottom: 12px;
  line-height: 32px;
  position: sticky;
  top: 0;
  z-index: 9999;
  background: white;
}

.recycle-scroller-demo.page-mode .toolbar {
  border-bottom: solid 1px #e0edfa;
}

.toolbar > *:not(:last-child) {
  margin-right: 24px;
}

.avatar {
  background: grey;
}
</style>

<style scoped>
.wrapper,
.scroller {
  height: 100%;
}

.wrapper {
  display: flex;
  flex-direction: column;
}

.toolbar {
  flex: none;
}

.scroller {
  flex: 1;
}

.scroller :deep(.hover) img {
  opacity: 0.5;
}

.item {
  position: relative;
  height: 100%;
}

.index {
  position: absolute;
  top: 2px;
  left: 2px;
  padding: 4px;
  border-radius: 4px;
  background-color: rgb(255 255 255 / 85%);
  color: black;
}

img {
  width: 100%;
  height: 100%;
  background: #eee;
  object-fit: cover;
}
</style>
