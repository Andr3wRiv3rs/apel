<template>
    <section>

    <button
    class="cool-button"
    id="the-coolest-button"
        @click ="event => {for ( const i of ['a', 'b', 'c'] ) {
            console.log( i )
        }}"

        @mouseover ="event => console.log( event.trigger )"    >
    {{ ['press', 'me'].join(' ') + '!'}}
    </button>
    <a
        href ="https://example.com"
        target ="_blank"
        @click ="event => {for ( const i of ['a', 'b', 'c'] ) {
            console.log( i )
        }}"

        @mouseover ="event => console.log( event.trigger )"    >
    {{ `I'm a link!`}}
    </a>
</section>
</template>

<style lang="sass">
    section
        color: white
        .cool-button
            border: 2px solid white
        #the-coolest-button
            color: white
        @media ( max-width: 400px )
            .cool-button
                width: 100%
        button.cool-button#the-coolest-button
            background-color: black
        a
            color: cyan
            &:hover
                color: gray
</style>
