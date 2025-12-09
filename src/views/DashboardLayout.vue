<template>
  <PageFrame no-padding :allow-overflow="false">
    <div class="flex h-full">
      <aside>
      </aside>
      <main>
        <header>
          <slot name="header" />
        </header>
        <div class="content">
          <slot />
        </div>
      </main>
    </div>
  </PageFrame>
</template>