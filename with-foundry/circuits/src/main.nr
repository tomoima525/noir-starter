use dep::std;

fn main(
    commits: pub [Field; 3], // commitments, in the order of name, age, countrycode
    values: [Field; 3], // private inputs, in the order of name, age, countrycode
    nonces: [Field; 3],
    ) {
        for i in 0..3 {
        assert(commits[i] == std::hash::poseidon::bn254::hash_2([values[i], nonces[i]]));
    }
}
