import Stripe from 'stripe';
import config from '.';

const stripe = new Stripe(config.stripe.stripe_secret_key as string);

export default stripe;
