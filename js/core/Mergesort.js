/*!
 * Merge sort; stable, O(n*log(n))
 *
 * \param comp Given i,j has to return true iff i is greater than j.
 *
 * Modified version of 
 *    http://www.stoimen.com/blog/2010/07/02/friday-algorithms-javascript-merge-sort/
 */
function mergeSort(arr, comp)
{
    if (arr.length < 2)
        return arr;
 
    var middle = parseInt(arr.length / 2);
    var left   = arr.slice(0, middle);
    var right  = arr.slice(middle, arr.length);
 
    return merge(mergeSort(left,comp), mergeSort(right,comp), comp);
}


/*!
 * \see mergeSort
 */
function merge(left, right, comp)
{
    var result = [];
 
    while (left.length && right.length) {
    	if ( !comp(right[0],left[0])) { // not (right[0] > left[0])
            result.push(left.shift());
        } else {
            result.push(right.shift());
        }
    }
 
    while (left.length)
        result.push(left.shift());
 
    while (right.length)
        result.push(right.shift());
 
    return result;
}