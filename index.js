
import helloworld from './src/test'
import { sub as subFn, subName } from './src/sub'
let name = subName

function self() {
  helloworld(name)
  helloworld(name)
  let subName = 'self'
  return subName
}

self()
helloworld(name)

console.log(subFn(20, 9))
export default name