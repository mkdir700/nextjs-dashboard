'use client';
// 'use client' 表示这是一个客户端文件，会被编译到浏览器端
// 这意味着你可以在这个文件中使用浏览器环境的 API，例如使用事件监听器和钩子。

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';


export default function Search({ placeholder }: { placeholder: string }) {
  // URLSearchParams 是一个 Web API，提供用于操作 URL 查询参数的使用方法。
  // 可以使用它来获取类似 ?page=1&query=a 的参数字符串，而不是创建复杂的字符串字面量。
  const searchParams = useSearchParams();

  // usePathname() 返回当前页面的路径名，例如 /dashboard/invoices
  const pathname = usePathname();

  // useRouter() 返回一个对象，包含了路由相关的方法和属性，例如 push、replace、query 等。
  const { replace } = useRouter();

  function handleSearch(term: string) {
    console.log(`Searching... ${term}`);
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('query', term);
    } else {
      params.delete('query');
    }
    // replace 方法用于替换当前页面的 URL，不会留下历史记录。
    replace(`${pathname}?${params.toString()}`);
  }

  // useDebouncedCallback() 是一个自定义钩子，用于创建一个防抖函数。
  // 防抖函数会在一段时间内，只执行最后一次调用，避免频繁触发。
  // 这里使用了 300 毫秒的延迟，避免用户输入时频繁更新 URL。
  // 去抖动的工作原理：
  // 1. 触发事件：当发生应该去抖动的事件时（如搜索框中的按键），计时器开始
  // 2. 等待：如果在计时器到期之前发生新的事件，计时器将重置
  // 3. 执行：当计时器到期时，去抖函数将被执行.
  const handleSearchDebounced = useDebouncedCallback(handleSearch, 1000);

  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <input
        className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
        placeholder={placeholder}
        onChange={(e) => {
          handleSearchDebounced(e.target.value);
        }}
        defaultValue={searchParams.get('query')?.toString()}  // 保持 URL 和输入框的同步
      />
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
    </div>
  );
}
