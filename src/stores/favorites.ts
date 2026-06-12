/** 收藏 store */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useFavoritesStore = defineStore('favorites', () => {
  const favorites = ref<string[]>([])

  function toggleFavorite(id: string, onFirstFav?: () => void, onFavCount?: (count: number) => void) {
    const idx = favorites.value.indexOf(id)
    if (idx === -1) {
      favorites.value.unshift(id)
      if (onFirstFav) onFirstFav()
      if (onFavCount) onFavCount(favorites.value.length)
    } else {
      favorites.value.splice(idx, 1)
    }
  }

  function isFavorite(id: string) {
    return computed(() => favorites.value.includes(id))
  }

  function reset() {
    favorites.value = []
  }

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    reset,
  }
})
