#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env};

fn setup_escrow(env: &Env) -> (RentEscrowContractClient<'_>, Address, Address, Address) {
    let contract_id = env.register(RentEscrowContract, ());
    let client = RentEscrowContractClient::new(env, &contract_id);

    let landlord = Address::generate(env);
    let roommate_a = Address::generate(env);
    let roommate_b = Address::generate(env);

    let mut roommate_shares = Map::new(env);
    roommate_shares.set(roommate_a.clone(), 500_i128);
    roommate_shares.set(roommate_b.clone(), 500_i128);

    env.mock_all_auths();
    client.initialize(&landlord, &1000_i128, &roommate_shares);

    (client, landlord, roommate_a, roommate_b)
}

#[test]
fn test_initialize() {
    let env = Env::default();
    let contract_id = env.register(RentEscrowContract, ());
    let client = RentEscrowContractClient::new(&env, &contract_id);

    let landlord = Address::generate(&env);
    let mut roommate_shares: Map<Address, i128> = Map::new(&env);
    roommate_shares.set(Address::generate(&env), 500);
    roommate_shares.set(Address::generate(&env), 500);

    env.mock_all_auths();
    client.initialize(&landlord, &1000_i128, &roommate_shares);

    env.as_contract(&contract_id, || {
        let escrow: RentEscrow = env
            .storage()
            .persistent()
            .get(&DataKey::Escrow)
            .expect("escrow should be stored after initialize");

        assert_eq!(escrow.landlord, landlord);
    });
}

#[test]
fn test_total_funded_zero_before_contributions() {
    let env = Env::default();
    let (client, _, _, _) = setup_escrow(&env);

    assert_eq!(client.get_total_funded(), 0_i128);
}

#[test]
fn test_total_funded_after_partial_contributions() {
    let env = Env::default();
    let (client, _, roommate_a, _) = setup_escrow(&env);

    client.contribute(&roommate_a, &300_i128);

    assert_eq!(client.get_total_funded(), 300_i128);
    assert_eq!(client.is_fully_funded(), false);
}

#[test]
fn test_total_funded_after_all_contributions() {
    let env = Env::default();
    let (client, _, roommate_a, roommate_b) = setup_escrow(&env);

    client.contribute(&roommate_a, &500_i128);
    client.contribute(&roommate_b, &500_i128);

    assert_eq!(client.get_total_funded(), 1000_i128);
    assert_eq!(client.is_fully_funded(), true);
}

#[test]
fn test_is_fully_funded_with_overfunding() {
    let env = Env::default();
    let (client, _, roommate_a, roommate_b) = setup_escrow(&env);

    client.contribute(&roommate_a, &600_i128);
    client.contribute(&roommate_b, &500_i128);

    assert_eq!(client.get_total_funded(), 1100_i128);
    assert_eq!(client.is_fully_funded(), true);
}
