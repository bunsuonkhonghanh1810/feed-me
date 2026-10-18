//// Math utilities for Feed Me contracts
//// Provides integer square root calculation for Quadratic Voting (√Token)

pub fn isqrt(n: Int) -> Int {
  if n <= 0 {
    0
  } else if n < 4 {
    1
  } else {
    let x0 = n / 2
    let x1 = (x0 + n / x0) / 2
    do_isqrt(n, x0, x1)
  }
}

fn do_isqrt(n: Int, x0: Int, x1: Int) -> Int {
  if x1 >= x0 {
    x0
  } else {
    do_isqrt(n, x1, (x1 + n / x1) / 2)
  }
}

test test_isqrt_zero() {
  isqrt(0) == 0
}

test test_isqrt_small() {
  isqrt(1) == 1 && isqrt(2) == 1 && isqrt(3) == 1
}

test test_isqrt_exact_squares() {
  and {
    isqrt(4) == 2,
    isqrt(9) == 3,
    isqrt(16) == 4,
    isqrt(25) == 5,
    isqrt(100) == 10,
    isqrt(144) == 12,
    isqrt(10000) == 100,
    isqrt(1000000) == 1000,
  }
}

test test_isqrt_non_squares() {
  and {
    isqrt(8) == 2,
    isqrt(15) == 3,
    isqrt(99) == 9,
    isqrt(101) == 10,
    isqrt(143) == 11,
  }
}

pub fn is_consensus_reached(yes_votes: Int, total_votes: Int) -> Bool {
  total_votes > 0 && yes_votes >= 0 && yes_votes <= total_votes && yes_votes * 4 >= total_votes * 3
}

test test_consensus_boundary() {
  and {
    is_consensus_reached(75, 100),
    is_consensus_reached(80, 100),
    !is_consensus_reached(74, 100),
    !is_consensus_reached(0, 100),
    !is_consensus_reached(0, 0),
    is_consensus_reached(3, 4),
    !is_consensus_reached(2, 3),
    is_consensus_reached(100, 100),
  }
}

