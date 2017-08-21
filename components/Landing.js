const h = require('react-hyperscript')
const page = require('page')

function addToStorageString(oldVal, newVal){
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

function onRepoClick(){

}

function getRepoHistory() {
  const history = localStorage.getObject('repoHistory');
  if (history){
    const historyList = history.split(' ');
    console.log(historyList);
    historyList.map((repo) => {
      return
      <li onClick={onRepoClick} key={repo}>{repo}</li>;
    });
  }
}

module.exports = function Landing (ctx) {

  return h('#Landing', [
    h('center', [
      h('ul', getRepoHistory()),
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
