/**
 * Created by lilu on 2016/12/24.
 */

function getArticles(state) {
  return state.ARTICLE
}

export function getArticleByCid(state, categoryId) {
  let articles = getArticles(state).get(categoryId)
  if (articles) {
    return articles.toJS()
  }

  return undefined
}

export function getArticleCollection(state) {
  let articles = getArticles(state)
  let articleArray = []
  articles.forEach((value, key) => {
    let articleItem = {}
    articleItem.id = key
    articleItem.articles = value.toJS()
    articleArray.push(articleItem)
  })
  return articleArray
}