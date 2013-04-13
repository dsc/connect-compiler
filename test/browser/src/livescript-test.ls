console.log "livescript!"

times = (x, y) --> x * y
console.log 'times 2, 3  #=> 6', times 2, 3       #=> 6 (normal use works as expected)
double = times 2
console.log 'double 5  #=> 10', double 5         #=> 10

filter-nums = filter _, [1 to 5]
console.log 'filter-nums even   #=> [2,4]', filter-nums even  #=> [2,4]
console.log 'filter-nums odd    #=> [1,3,5]', filter-nums odd   #=> [1,3,5]
console.log 'filter-nums (< 3)  #=> [1,2]', filter-nums (< 3) #=> [1,2]

r = [1 2 3]
    |> _.map _, (* 2)
    |> _.reduce _, (+), 0
console.log '[1 2 3] |> map |> reduce  #=> 12', r
