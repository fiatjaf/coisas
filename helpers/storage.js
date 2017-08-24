const h = require('react-hyperscript')
const page = require('page')

function addToStorageString(oldVal, newVal){
  if (newVal === ''){
    return oldVal;
  }
  let arr = oldVal.split(' ');

  while (arr.indexOf(newVal) !== -1){
    var index = arr.indexOf(newVal);
    arr.splice(index, 1);
  }
  arr.push(newVal);
  while (arr.length > 5){
    arr.splice(0, 1);
  }
  return arr.join(' ');
}

Storage.prototype.setObject = function(key, value) {
  let temp = localStorage.getObject(key);
  if (temp){
    value = addToStorageString(temp, value);
  }
  this.setItem(key, JSON.stringify(value));    
};

Storage.prototype.getObject = function(key) {
  var value = this.getItem(key);
  return value && JSON.parse(value);
};

function onRepoClick(repoName) {
  const slug = /(github.com\/)?([^\/]+)\/([^\/]+)(\/.*)?/.exec(repoName).slice(2, 4).join('/');
  page('#!/' + slug + '/');
}

module.exports = {
  storeRepo: function storeRepo(repoName) {
    localStorage.setObject('repoHistory', repoName);
  },
  getRepoHistory: function getRepoHistory() {
    const history = localStorage.getObject('repoHistory');
    if (history){
      const historyList = history.split(' ');
      const historyListItems = historyList.map( (repo) => {
        return h('li.repoListItem', {key: repo, onClick: () => onRepoClick(repo)}, repo);
      });
      return historyListItems.reverse();
    }
    return h('li', 'No recently visited repositories.');
  }
  
};