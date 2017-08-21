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

function storeRepo(repoName) {
  localStorage.setObject('repoHistory', repoName);
}

function onRepoClick(repoName) {
  console.log("Clicked " + repoName);
  storeRepo(repoName);
  const slug = /(github.com\/)?([^\/]+)\/([^\/]+)(\/.*)?/.exec(repoName).slice(2, 4).join('/');
  page('#!/' + slug + '/');
}

function getRepoHistory() {
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

module.exports = function Landing (ctx) {

  return h('#Landing', [
    h('center', [
      h('p', 'Recently Viewed Repositories: '),
      h('ul', [getRepoHistory()]),
      h('form', {
        onSubmit: e => {
          e.preventDefault()
          let v = e.target.repo.value
          storeRepo(v)
          let slug = /(github.com\/)?([^\/]+)\/([^\/]+)(\/.*)?/.exec(v).slice(2, 4).join('/')
          page('#!/' + slug + '/')
        }
      }, [
        h('p', 'Type your GitHub repository name'),
        h('input.input.is-large', {name: 'repo', placeholder: 'fiatjaf/coisas'}),
        h('button.button.is-large.is-dark', 'Go')
      ])
    ])
  ])
}
