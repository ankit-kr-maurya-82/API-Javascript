// 1. Result
//    - A program that checks if a number is even or odd.

// 2. Code
//    ```javascript
function checkNumber(num) {
  if (num % 2 === 0) {
    console.log(num + " is even");
  } else {
    console.log(num + " is odd");
  }
}


checkNumber(10);
checkNumber(11);
// ```/

// 3. Explanation
//    - We create a function `checkNumber` that takes a number `num`.
//    - Inside the function, we use `if` to check if `num` is even by seeing if it leaves a remainder when divided by 2 (`num % 2 === 0`).
//    - If `num` is even, we print that it's even; otherwise, we print that it's odd.
//    - We then call `checkNumber` with example numbers to test it.

// 4. Required Libraries
//    - No extra libraries needed